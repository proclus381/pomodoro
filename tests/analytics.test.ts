import { describe, it, expect } from 'vitest';
import {
	byDay,
	byHour,
	byPreset,
	currentStreak,
	totalDeepWorkSec,
	workSessions,
	sessionsThisWeek,
	dateKey
} from '../src/lib/analytics';
import type { Session } from '../src/lib/db/schema';

function s(over: Partial<Session>): Session {
	return {
		startedAt: Date.now(),
		endedAt: Date.now(),
		plannedDurationSec: 1500,
		actualDurationSec: 1500,
		type: 'work',
		preset: 'classic',
		task: 'test',
		definitionOfDone: 'done',
		interruptionCount: 0,
		parkItNoteIds: [],
		completed: true,
		...over
	};
}

describe('analytics', () => {
	it('only counts completed work sessions toward totals', () => {
		const list = [
			s({ actualDurationSec: 1500, completed: true }),
			s({ type: 'short-break', completed: true, actualDurationSec: 300 }),
			s({ completed: false, actualDurationSec: 800 })
		];
		expect(workSessions(list).length).toBe(1);
		expect(totalDeepWorkSec(list)).toBe(1500);
	});

	it('byDay groups by local date', () => {
		const t1 = new Date('2025-01-10T10:00:00').getTime();
		const t2 = new Date('2025-01-10T14:00:00').getTime();
		const t3 = new Date('2025-01-11T09:00:00').getTime();
		const buckets = byDay([s({ startedAt: t1 }), s({ startedAt: t2 }), s({ startedAt: t3 })]);
		expect(buckets.length).toBe(2);
		expect(buckets[0].count).toBe(2);
		expect(buckets[1].count).toBe(1);
	});

	it('byHour places sessions into 24 buckets', () => {
		const t9 = new Date(); t9.setHours(9, 0, 0, 0);
		const t14 = new Date(); t14.setHours(14, 30, 0, 0);
		const out = byHour([s({ startedAt: t9.getTime() }), s({ startedAt: t14.getTime() })]);
		expect(out.length).toBe(24);
		expect(out[9].count).toBe(1);
		expect(out[14].count).toBe(1);
	});

	it('byPreset aggregates per preset id', () => {
		const out = byPreset([
			s({ preset: 'classic', focusRating: 4 }),
			s({ preset: 'classic', focusRating: 5 }),
			s({ preset: 'long', focusRating: 3 })
		]);
		const classic = out.find((b) => b.preset === 'classic')!;
		const long = out.find((b) => b.preset === 'long')!;
		expect(classic.count).toBe(2);
		expect(classic.avgFocus).toBeCloseTo(4.5);
		expect(long.count).toBe(1);
	});

	it('currentStreak treats today as a free pass (not yet done)', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		const streak = currentStreak([
			s({ startedAt: yesterday.getTime() }),
			s({ startedAt: twoDaysAgo.getTime() })
		]);
		expect(streak).toBe(2);
	});

	it('currentStreak counts vacation days', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const twoDaysAgo = new Date();
		twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
		const vac = new Set([dateKey(yesterday.getTime())]);
		const streak = currentStreak([s({ startedAt: twoDaysAgo.getTime() })], vac);
		expect(streak).toBe(2);
	});

	it('sessionsThisWeek counts only this calendar week', () => {
		const now = Date.now();
		const farPast = now - 60 * 24 * 3600 * 1000;
		const count = sessionsThisWeek([
			s({ startedAt: now }),
			s({ startedAt: now }),
			s({ startedAt: farPast })
		]);
		expect(count).toBe(2);
	});
});
