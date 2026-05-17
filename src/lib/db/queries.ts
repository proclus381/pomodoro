import { db, type Session, type ParkItNote, type RecentTask } from './schema';

export async function createSession(s: Omit<Session, 'id'>): Promise<number> {
	return (await db().sessions.add(s as Session)) as number;
}

export async function updateSession(id: number, patch: Partial<Session>): Promise<void> {
	await db().sessions.update(id, patch);
}

export async function getSession(id: number): Promise<Session | undefined> {
	return db().sessions.get(id);
}

export async function listSessions(sinceMs?: number): Promise<Session[]> {
	const all = sinceMs
		? await db().sessions.where('startedAt').aboveOrEqual(sinceMs).toArray()
		: await db().sessions.toArray();
	return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function addParkItNote(n: Omit<ParkItNote, 'id'>): Promise<number> {
	return (await db().parkItNotes.add(n as ParkItNote)) as number;
}

export async function notesForSession(sessionId: number): Promise<ParkItNote[]> {
	return db().parkItNotes.where('sessionId').equals(sessionId).toArray();
}

export async function updateNote(id: number, patch: Partial<ParkItNote>): Promise<void> {
	await db().parkItNotes.update(id, patch);
}

export async function upsertRecentTask(text: string, tag?: string): Promise<void> {
	const existing = await db().recentTasks.where('text').equals(text).first();
	const now = Date.now();
	if (existing) {
		await db().recentTasks.update(existing.id!, {
			lastUsedAt: now,
			useCount: existing.useCount + 1,
			tag: tag ?? existing.tag
		});
	} else {
		await db().recentTasks.add({ text, lastUsedAt: now, useCount: 1, tag } as RecentTask);
	}
}

export async function recentTasks(limit = 10): Promise<RecentTask[]> {
	const all = await db().recentTasks.toArray();
	return all.sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, limit);
}

export async function exportAll() {
	return {
		sessions: await db().sessions.toArray(),
		parkItNotes: await db().parkItNotes.toArray(),
		blocklist: await db().blocklist.toArray(),
		recentTasks: await db().recentTasks.toArray(),
		settings: await db().settings.toArray(),
		exportedAt: new Date().toISOString(),
		schemaVersion: 1
	};
}

export async function clearAll() {
	await Promise.all([
		db().sessions.clear(),
		db().parkItNotes.clear(),
		db().blocklist.clear(),
		db().recentTasks.clear(),
		db().settings.clear()
	]);
}
