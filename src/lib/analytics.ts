import type { Session } from './db/schema';

export interface DayBucket {
	dateKey: string; // YYYY-MM-DD
	count: number;
	totalSec: number;
	avgFocus: number | null;
}

function dateKey(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = (d.getMonth() + 1).toString().padStart(2, '0');
	const day = d.getDate().toString().padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function workSessions(sessions: Session[]): Session[] {
	return sessions.filter((s) => s.type === 'work' && s.completed);
}

export function totalDeepWorkSec(sessions: Session[]): number {
	return workSessions(sessions).reduce((acc, s) => acc + s.actualDurationSec, 0);
}

export function byDay(sessions: Session[]): DayBucket[] {
	const work = workSessions(sessions);
	const map = new Map<string, DayBucket>();
	for (const s of work) {
		const k = dateKey(s.startedAt);
		const b = map.get(k) ?? { dateKey: k, count: 0, totalSec: 0, avgFocus: null };
		b.count += 1;
		b.totalSec += s.actualDurationSec;
		if (s.focusRating) {
			const prev = b.avgFocus ?? 0;
			const n = b.count;
			b.avgFocus = (prev * (n - 1) + s.focusRating) / n;
		}
		map.set(k, b);
	}
	return [...map.values()].sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
}

/**
 * Compassionate streak: a day "counts" if there's at least 1 completed work session,
 * OR the user has marked it a vacation day. Today does not break the streak if it's
 * not yet ended (we don't penalize "I haven't done my session today, it's 9am").
 */
export function currentStreak(sessions: Session[], vacationDays: Set<string> = new Set()): number {
	const days = new Set(byDay(sessions).filter((b) => b.count > 0).map((b) => b.dateKey));
	let streak = 0;
	const today = new Date();
	for (let i = 0; i < 365; i++) {
		const d = new Date(today);
		d.setDate(today.getDate() - i);
		const k = dateKey(d.getTime());
		if (days.has(k) || vacationDays.has(k)) {
			streak += 1;
		} else if (i === 0) {
			// don't penalize "today not done yet"
			continue;
		} else {
			break;
		}
	}
	return streak;
}

/**
 * Time-of-day heatmap: hours 0..23 × avg focus rating, plus session count.
 */
export interface HourBucket {
	hour: number;
	count: number;
	avgFocus: number | null;
}

export function byHour(sessions: Session[]): HourBucket[] {
	const work = workSessions(sessions);
	const buckets: HourBucket[] = Array.from({ length: 24 }, (_, h) => ({
		hour: h,
		count: 0,
		avgFocus: null
	}));
	for (const s of work) {
		const h = new Date(s.startedAt).getHours();
		const b = buckets[h];
		b.count += 1;
		if (s.focusRating) {
			const prev = b.avgFocus ?? 0;
			b.avgFocus = (prev * (b.count - 1) + s.focusRating) / b.count;
		}
	}
	return buckets;
}

export interface PresetBucket {
	preset: string;
	count: number;
	avgFocus: number | null;
}

export function byPreset(sessions: Session[]): PresetBucket[] {
	const work = workSessions(sessions);
	const map = new Map<string, PresetBucket>();
	for (const s of work) {
		const b = map.get(s.preset) ?? { preset: s.preset, count: 0, avgFocus: null };
		b.count += 1;
		if (s.focusRating) {
			const prev = b.avgFocus ?? 0;
			b.avgFocus = (prev * (b.count - 1) + s.focusRating) / b.count;
		}
		map.set(s.preset, b);
	}
	return [...map.values()].sort((a, b) => b.count - a.count);
}

export function sessionsThisWeek(sessions: Session[]): number {
	const work = workSessions(sessions);
	const now = new Date();
	const day = now.getDay();
	const start = new Date(now);
	start.setDate(now.getDate() - day);
	start.setHours(0, 0, 0, 0);
	return work.filter((s) => s.startedAt >= start.getTime()).length;
}

export { dateKey };
