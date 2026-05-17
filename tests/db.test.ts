import { describe, it, expect, beforeEach } from 'vitest';
import { _resetDb, db } from '../src/lib/db/schema';
import {
	createSession,
	updateSession,
	listSessions,
	addParkItNote,
	notesForSession,
	upsertRecentTask,
	recentTasks,
	exportAll,
	clearAll
} from '../src/lib/db/queries';

beforeEach(async () => {
	_resetDb();
	await db().delete();
	_resetDb();
});

describe('db queries', () => {
	it('creates and updates a session', async () => {
		const id = await createSession({
			startedAt: 1000,
			endedAt: null,
			plannedDurationSec: 1500,
			actualDurationSec: 0,
			type: 'work',
			preset: 'classic',
			task: 'draft',
			definitionOfDone: 'two paras',
			interruptionCount: 0,
			parkItNoteIds: [],
			completed: false
		});
		expect(id).toBeGreaterThan(0);
		await updateSession(id, { completed: true, focusRating: 5 });
		const list = await listSessions();
		expect(list[0].completed).toBe(true);
		expect(list[0].focusRating).toBe(5);
	});

	it('park-it notes attach to a session', async () => {
		const sid = await createSession({
			startedAt: 1000,
			endedAt: null,
			plannedDurationSec: 1500,
			actualDurationSec: 0,
			type: 'work',
			preset: 'classic',
			task: 'x',
			definitionOfDone: 'y',
			interruptionCount: 0,
			parkItNoteIds: [],
			completed: false
		});
		await addParkItNote({ sessionId: sid, createdAt: 1100, text: 'check inbox later' });
		await addParkItNote({ sessionId: sid, createdAt: 1200, text: 'reply to alex' });
		const notes = await notesForSession(sid);
		expect(notes.length).toBe(2);
	});

	it('upsertRecentTask dedupes and bumps useCount', async () => {
		await upsertRecentTask('write blog', 'writing');
		await upsertRecentTask('write blog', 'writing');
		await upsertRecentTask('refactor api', 'code');
		const r = await recentTasks();
		expect(r.length).toBe(2);
		const blog = r.find((x) => x.text === 'write blog');
		expect(blog?.useCount).toBe(2);
	});

	it('exportAll and clearAll', async () => {
		await createSession({
			startedAt: 1000,
			endedAt: null,
			plannedDurationSec: 1500,
			actualDurationSec: 0,
			type: 'work',
			preset: 'classic',
			task: 'x',
			definitionOfDone: 'y',
			interruptionCount: 0,
			parkItNoteIds: [],
			completed: true
		});
		const dump = await exportAll();
		expect(dump.sessions.length).toBe(1);
		expect(dump.schemaVersion).toBe(1);
		await clearAll();
		const after = await listSessions();
		expect(after.length).toBe(0);
	});
});
