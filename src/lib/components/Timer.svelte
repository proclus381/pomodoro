<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		timer,
		startTick,
		stopTick,
		pause,
		resume,
		completeWork,
		startBreak,
		formatTime,
		remainingSec,
		progressFrac,
		incrementInterruption
	} from '$lib/stores/timer.svelte';
	import { settings } from '$lib/stores/settings.svelte';
	import Ring from './Ring.svelte';
	import ParkIt from './ParkIt.svelte';
	import { audio } from '$lib/audio/loop-manager';
	import { notify } from '$lib/notifications/sw-notify';
	import { softBellExplain, dndExplain } from '$lib/research/copy';
	import { updateSession } from '$lib/db/queries';

	let parkOpen = $state(false);
	let pauseHoldStart = $state<number | null>(null);
	let pauseProgress = $state(0);
	let holdHandle: ReturnType<typeof setInterval> | null = null;
	const PAUSE_HOLD_MS = 1500;

	const remaining = $derived(
		remainingSec(timer.pausedAt ?? timer.tickNow, timer.endAt)
	);
	const progress = $derived(
		progressFrac(timer.pausedAt ?? timer.tickNow, timer.startAt, timer.endAt)
	);
	const isPaused = $derived(timer.pausedAt !== null);

	onMount(() => {
		startTick(async (kind) => {
			await audio.bell(kind, settings.bellVolume);
			if (kind === 'end' && timer.blockType === 'work') {
				notify('Block complete', `${timer.currentTask} — nice work.`);
				const id = timer.currentSessionId;
				if (id) {
					await updateSession(id, {
						endedAt: Date.now(),
						actualDurationSec: timer.preset.workSec,
						completed: true,
						interruptionCount: timer.interruptionCount
					});
				}
				completeWork();
			} else if (kind === 'end' && (timer.blockType === 'short-break' || timer.blockType === 'long-break')) {
				notify('Break over', 'Ready to focus again?');
			}
		});
		window.addEventListener('keydown', onKey);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', onBlur);
	});

	onDestroy(() => {
		stopTick();
		window.removeEventListener('keydown', onKey);
		window.removeEventListener('keyup', onKeyUp);
		window.removeEventListener('blur', onBlur);
		if (holdHandle) clearInterval(holdHandle);
	});

	function onBlur() {
		if (timer.phase === 'work' && timer.dndEnabled) {
			incrementInterruption();
		}
	}

	function onKey(e: KeyboardEvent) {
		if (parkOpen) return;
		if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
		if (e.key === 'k' && timer.phase === 'work') {
			e.preventDefault();
			parkOpen = true;
			return;
		}
		if (e.key === 's' && timer.phase === 'work') {
			e.preventDefault();
			skipToBreak();
			return;
		}
		if (e.key.toLowerCase() === 'd') {
			timer.dndEnabled = !timer.dndEnabled;
			return;
		}
		if (e.key.toLowerCase() === 'p' && pauseHoldStart === null) {
			e.preventDefault();
			beginPauseHold();
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		if (e.key.toLowerCase() === 'p') cancelPauseHold();
	}

	function beginPauseHold() {
		if (timer.phase !== 'work' && timer.phase !== 'break') return;
		if (isPaused) {
			resume();
			return;
		}
		pauseHoldStart = performance.now();
		pauseProgress = 0;
		holdHandle = setInterval(() => {
			if (pauseHoldStart === null) return;
			pauseProgress = Math.min(1, (performance.now() - pauseHoldStart) / PAUSE_HOLD_MS);
			if (pauseProgress >= 1) {
				pause();
				cancelPauseHold();
			}
		}, 30);
	}

	function cancelPauseHold() {
		pauseHoldStart = null;
		pauseProgress = 0;
		if (holdHandle) clearInterval(holdHandle);
		holdHandle = null;
	}

	async function skipToBreak() {
		const id = timer.currentSessionId;
		if (id) {
			const elapsedSec = Math.floor(
				((timer.pausedAt ?? performance.now() + performance.timeOrigin) - timer.startAt) / 1000
			);
			await updateSession(id, {
				endedAt: Date.now(),
				actualDurationSec: Math.max(0, elapsedSec),
				completed: false,
				interruptionCount: timer.interruptionCount
			});
		}
		completeWork();
	}

	async function nextBreak() {
		startBreak();
	}
</script>

<div class="timer-wrap" class:dnd={timer.dndEnabled && timer.phase === 'work'}>
	<div class="ring-wrap">
		<Ring progress={progress} />
		<div class="readout">
			<div class="big" style:font-variant-numeric="tabular-nums">{formatTime(remaining)}</div>
			<div class="phase">{timer.blockType.replace('-', ' ')}{isPaused ? ' · paused' : ''}</div>
			{#if timer.phase === 'work'}
				<div class="task" title={timer.currentTask}>{timer.currentTask}</div>
				<div class="dod">→ {timer.currentDoD}</div>
			{/if}
		</div>
	</div>

	<div class="controls">
		{#if timer.phase === 'work'}
			<button
				class="ghost"
				onmousedown={beginPauseHold}
				onmouseup={cancelPauseHold}
				onmouseleave={cancelPauseHold}
				ontouchstart={beginPauseHold}
				ontouchend={cancelPauseHold}
			>
				{isPaused ? 'tap to resume' : pauseHoldStart ? `hold… ${Math.round(pauseProgress * 100)}%` : 'hold to pause (P)'}
			</button>
			<button class="ghost" onclick={() => (parkOpen = true)}>park it · K</button>
			<button class="ghost" onclick={skipToBreak}>skip to break · S</button>
		{:else if timer.phase === 'break-prompt'}
			<button class="primary" onclick={nextBreak}>start break</button>
		{/if}
	</div>

	{#if timer.phase === 'work'}
		<div class="hints">
			<span class="hint">{timer.dndEnabled ? '🕯 DND on' : 'DND off'} · {dndExplain}</span>
			<span class="hint">{softBellExplain}</span>
		</div>
	{/if}
</div>

<ParkIt bind:open={parkOpen} onclose={() => (parkOpen = false)} />

<style>
	.timer-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.75rem;
	}
	.timer-wrap.dnd {
		filter: saturate(0.85);
	}
	.ring-wrap {
		position: relative;
		width: 320px;
		height: 320px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.readout {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.35rem;
		padding: 0 1.5rem;
	}
	.big {
		font-size: 3.5rem;
		font-weight: 300;
		letter-spacing: -0.02em;
		line-height: 1;
	}
	.phase {
		font-size: 0.85rem;
		color: var(--text-faint);
		text-transform: lowercase;
		letter-spacing: 0.05em;
	}
	.task {
		font-size: 0.95rem;
		color: var(--text);
		margin-top: 0.5rem;
		max-width: 18ch;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.dod {
		font-size: 0.78rem;
		color: var(--text-faint);
		max-width: 24ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.controls {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.hints {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: center;
		max-width: 480px;
		text-align: center;
	}
	.hint {
		font-size: 0.75rem;
		color: var(--text-faint);
	}
</style>
