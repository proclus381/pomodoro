export type Phase = 'idle' | 'ritual' | 'work' | 'break-prompt' | 'break' | 'log';
export type BlockType = 'work' | 'short-break' | 'long-break';

export interface Preset {
	id: string;
	label: string;
	workSec: number;
	shortBreakSec: number;
	longBreakSec: number;
	cyclesBeforeLongBreak: number;
}

export const PRESETS: Preset[] = [
	{
		id: 'classic',
		label: 'Classic 25/5',
		workSec: 25 * 60,
		shortBreakSec: 5 * 60,
		longBreakSec: 20 * 60,
		cyclesBeforeLongBreak: 4
	},
	{
		id: 'long',
		label: 'Long 50/10',
		workSec: 50 * 60,
		shortBreakSec: 10 * 60,
		longBreakSec: 30 * 60,
		cyclesBeforeLongBreak: 3
	},
	{
		id: 'ultradian',
		label: 'Ultradian 90/20',
		workSec: 90 * 60,
		shortBreakSec: 20 * 60,
		longBreakSec: 30 * 60,
		cyclesBeforeLongBreak: 2
	}
];

export function remainingSec(now: number, endAt: number): number {
	return Math.max(0, Math.ceil((endAt - now) / 1000));
}

export function progressFrac(now: number, startAt: number, endAt: number): number {
	const total = endAt - startAt;
	if (total <= 0) return 1;
	return Math.min(1, Math.max(0, (now - startAt) / total));
}

export function formatTime(totalSec: number): string {
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}
