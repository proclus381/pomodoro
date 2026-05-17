import { browser } from '$app/environment';
import {
	PRESETS,
	type BlockType,
	type Phase,
	type Preset
} from '$lib/timer/core';

export {
	PRESETS,
	remainingSec,
	progressFrac,
	formatTime,
	type Phase,
	type BlockType,
	type Preset
} from '$lib/timer/core';

function now(): number {
	return browser && performance ? performance.timeOrigin + performance.now() : Date.now();
}

interface TimerState {
	phase: Phase;
	blockType: BlockType;
	preset: Preset;
	cycleCount: number;
	startAt: number;
	endAt: number;
	pausedAt: number | null;
	tickNow: number;
	softBellFired: boolean;
	bellFired: boolean;
	currentSessionId: number | null;
	currentTask: string;
	currentDoD: string;
	currentTag: string;
	dndEnabled: boolean;
	interruptionCount: number;
}

export const timer = $state<TimerState>({
	phase: 'idle',
	blockType: 'work',
	preset: PRESETS[0],
	cycleCount: 0,
	startAt: 0,
	endAt: 0,
	pausedAt: null,
	tickNow: now(),
	softBellFired: false,
	bellFired: false,
	currentSessionId: null,
	currentTask: '',
	currentDoD: '',
	currentTag: '',
	dndEnabled: false,
	interruptionCount: 0
});

let tickHandle: ReturnType<typeof setInterval> | null = null;

export function startTick(onBell?: (kind: 'soft' | 'end') => void) {
	stopTick();
	if (!browser) return;
	tickHandle = setInterval(() => {
		timer.tickNow = now();
		if (timer.phase === 'work' || timer.phase === 'break') {
			const total = timer.endAt - timer.startAt;
			const elapsed = timer.tickNow - timer.startAt;
			if (!timer.softBellFired && timer.phase === 'work' && elapsed >= total * 0.8) {
				timer.softBellFired = true;
				onBell?.('soft');
			}
			if (!timer.bellFired && timer.tickNow >= timer.endAt) {
				timer.bellFired = true;
				onBell?.('end');
			}
		}
	}, 250);
}

export function stopTick() {
	if (tickHandle) {
		clearInterval(tickHandle);
		tickHandle = null;
	}
}

export function beginRitual(
	preset: Preset,
	task: string,
	dod: string,
	tag = '',
	dnd = true
) {
	timer.preset = preset;
	timer.currentTask = task.trim();
	timer.currentDoD = dod.trim();
	timer.currentTag = tag.trim();
	timer.dndEnabled = dnd;
	timer.phase = 'ritual';
	timer.softBellFired = false;
	timer.bellFired = false;
	timer.interruptionCount = 0;
}

export function startWork(sessionId: number) {
	timer.currentSessionId = sessionId;
	timer.blockType = 'work';
	timer.startAt = now();
	timer.endAt = timer.startAt + timer.preset.workSec * 1000;
	timer.softBellFired = false;
	timer.bellFired = false;
	timer.pausedAt = null;
	timer.phase = 'work';
}

export function pause() {
	if (timer.phase !== 'work' && timer.phase !== 'break') return;
	if (timer.pausedAt !== null) return;
	timer.pausedAt = now();
}

export function resume() {
	if (timer.pausedAt === null) return;
	const delta = now() - timer.pausedAt;
	timer.startAt += delta;
	timer.endAt += delta;
	timer.pausedAt = null;
}

export function completeWork() {
	timer.phase = 'log';
}

export function startBreak() {
	timer.cycleCount += 1;
	const isLong = timer.cycleCount % timer.preset.cyclesBeforeLongBreak === 0;
	timer.blockType = isLong ? 'long-break' : 'short-break';
	const dur = isLong ? timer.preset.longBreakSec : timer.preset.shortBreakSec;
	timer.startAt = now();
	timer.endAt = timer.startAt + dur * 1000;
	timer.softBellFired = true;
	timer.bellFired = false;
	timer.pausedAt = null;
	timer.phase = 'break';
}

export function extendBreak(addSec: number) {
	timer.endAt += addSec * 1000;
	timer.bellFired = false;
}

export function endBreak() {
	timer.phase = 'idle';
	timer.currentSessionId = null;
}

export function abandon() {
	timer.phase = 'idle';
	timer.pausedAt = null;
	timer.currentSessionId = null;
}

export function incrementInterruption() {
	timer.interruptionCount += 1;
}

export function effectiveNow(): number {
	return timer.pausedAt ?? timer.tickNow;
}
