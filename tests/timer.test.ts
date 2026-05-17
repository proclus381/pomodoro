import { describe, it, expect } from 'vitest';
import { remainingSec, progressFrac, formatTime, PRESETS } from '../src/lib/timer/core';

describe('timer math', () => {
	it('remainingSec rounds up to the nearest second', () => {
		const now = 1_000_000;
		expect(remainingSec(now, now)).toBe(0);
		expect(remainingSec(now, now + 1)).toBe(1);
		expect(remainingSec(now, now + 999)).toBe(1);
		expect(remainingSec(now, now + 1000)).toBe(1);
		expect(remainingSec(now, now + 1500)).toBe(2);
	});

	it('remainingSec floors at zero past the end', () => {
		expect(remainingSec(2000, 1000)).toBe(0);
	});

	it('progressFrac is 0 at start, 1 at end, clamped outside', () => {
		expect(progressFrac(0, 0, 100)).toBe(0);
		expect(progressFrac(50, 0, 100)).toBe(0.5);
		expect(progressFrac(100, 0, 100)).toBe(1);
		expect(progressFrac(-1, 0, 100)).toBe(0);
		expect(progressFrac(200, 0, 100)).toBe(1);
	});

	it('formatTime renders m:ss', () => {
		expect(formatTime(0)).toBe('0:00');
		expect(formatTime(5)).toBe('0:05');
		expect(formatTime(65)).toBe('1:05');
		expect(formatTime(25 * 60)).toBe('25:00');
	});

	it('all presets have sane durations', () => {
		for (const p of PRESETS) {
			expect(p.workSec).toBeGreaterThan(0);
			expect(p.shortBreakSec).toBeGreaterThan(0);
			expect(p.longBreakSec).toBeGreaterThanOrEqual(p.shortBreakSec);
			expect(p.cyclesBeforeLongBreak).toBeGreaterThan(0);
		}
	});
});
