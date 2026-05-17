<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		timer,
		formatTime,
		remainingSec,
		startBreak,
		extendBreak,
		endBreak
	} from '$lib/stores/timer.svelte';
	import { notesForSession, updateNote } from '$lib/db/queries';
	import { randomBreakActivity, dontDoOnBreak } from '$lib/research/copy';
	import type { ParkItNote } from '$lib/db/schema';

	let activity = $state(randomBreakActivity());
	let extensions = $state(0);
	let twentyLeft = $state(20);
	let twentyRunning = $state(false);
	let twentyHandle: ReturnType<typeof setInterval> | null = null;
	let parkNotes = $state<ParkItNote[]>([]);

	const remaining = $derived(remainingSec(timer.tickNow, timer.endAt));

	onMount(async () => {
		if (timer.currentSessionId) {
			parkNotes = await notesForSession(timer.currentSessionId);
		}
		if (timer.phase === 'break-prompt' || timer.phase === 'log') {
			// hold here; user clicks start break
		}
	});

	onDestroy(() => {
		if (twentyHandle) clearInterval(twentyHandle);
	});

	function start20() {
		if (twentyRunning) return;
		twentyLeft = 20;
		twentyRunning = true;
		twentyHandle = setInterval(() => {
			twentyLeft -= 1;
			if (twentyLeft <= 0) {
				if (twentyHandle) clearInterval(twentyHandle);
				twentyHandle = null;
				twentyRunning = false;
			}
		}, 1000);
	}

	function extend() {
		if (extensions >= 2) return;
		extensions += 1;
		extendBreak(120);
	}

	function done() {
		endBreak();
	}

	async function resolve(n: ParkItNote, res: 'do-now' | 'schedule' | 'drop') {
		if (!n.id) return;
		await updateNote(n.id, { resolution: res });
		parkNotes = parkNotes.map((x) => (x.id === n.id ? { ...x, resolution: res } : x));
	}

	function startNow() {
		startBreak();
	}
</script>

<div class="break">
	{#if timer.phase === 'break-prompt'}
		<div class="prompt">
			<h2>Take the break.</h2>
			<p class="why">Real recovery means stepping away from the screen for a moment.</p>
			<button class="primary" onclick={startNow}>start break</button>
		</div>
	{:else}
		<div class="header">
			<div class="time">{formatTime(remaining)}</div>
			<div class="label">break</div>
		</div>

		<section class="activity">
			<h3>{activity.title}</h3>
			<p>{activity.body}</p>
			<small>{activity.why}</small>
			<button class="ghost" onclick={() => (activity = randomBreakActivity())}>
				suggest another
			</button>
		</section>

		<section class="eye">
			<div class="row">
				<strong>Eyes: 20-20-20</strong>
				{#if twentyRunning}
					<span>{twentyLeft}s</span>
				{:else}
					<button class="ghost" onclick={start20}>start 20s</button>
				{/if}
			</div>
			<small>Look at something 20 feet away for 20 seconds.</small>
		</section>

		{#if parkNotes.length}
			<section class="parked">
				<h3>Thoughts you parked</h3>
				<ul>
					{#each parkNotes as n}
						<li class:resolved={n.resolution}>
							<span class="t">{n.text}</span>
							<div class="res">
								<button class="ghost" class:on={n.resolution === 'do-now'} onclick={() => resolve(n, 'do-now')}>do now</button>
								<button class="ghost" class:on={n.resolution === 'schedule'} onclick={() => resolve(n, 'schedule')}>schedule</button>
								<button class="ghost" class:on={n.resolution === 'drop'} onclick={() => resolve(n, 'drop')}>drop</button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<p class="dont">{dontDoOnBreak}</p>

		<div class="actions">
			<button class="ghost" onclick={extend} disabled={extensions >= 2}>
				+2 min{extensions ? ` (${2 - extensions} left)` : ''}
			</button>
			<button class="primary" onclick={done}>I'm ready · next session →</button>
		</div>
	{/if}
</div>

<style>
	.break {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.prompt {
		text-align: center;
		padding: 4rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.prompt .why {
		color: var(--text-dim);
	}
	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}
	.time {
		font-size: 3rem;
		font-variant-numeric: tabular-nums;
		font-weight: 300;
	}
	.label {
		color: var(--text-faint);
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
	section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	section h3 {
		margin: 0;
		font-weight: 500;
		font-size: 1.05rem;
	}
	section p {
		margin: 0;
		color: var(--text-dim);
	}
	section small {
		color: var(--text-faint);
		font-size: 0.78rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.parked ul {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.parked li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.5rem;
		border-radius: var(--radius);
		background: var(--surface-2);
	}
	.parked li.resolved {
		opacity: 0.55;
	}
	.parked .t {
		flex: 1;
		font-size: 0.92rem;
	}
	.res {
		display: flex;
		gap: 0.25rem;
	}
	.res button {
		padding: 0.25rem 0.5rem;
		font-size: 0.78rem;
	}
	.res button.on {
		background: var(--accent);
		color: #1a1a1a;
		border-color: var(--accent);
	}
	.dont {
		color: var(--text-faint);
		font-size: 0.85rem;
		text-align: center;
		margin: 0;
	}
	.actions {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}
</style>
