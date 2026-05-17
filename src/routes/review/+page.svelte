<script lang="ts">
	import { onMount } from 'svelte';
	import { listSessions } from '$lib/db/queries';
	import { workSessions, currentStreak, sessionsThisWeek, totalDeepWorkSec } from '$lib/analytics';
	import { settings } from '$lib/stores/settings.svelte';
	import { compassionateStreak } from '$lib/research/copy';
	import type { Session } from '$lib/db/schema';

	let sessions = $state<Session[]>([]);
	let loaded = $state(false);

	onMount(async () => {
		sessions = await listSessions();
		loaded = true;
	});

	const work = $derived(workSessions(sessions));
	const week = $derived(sessionsThisWeek(sessions));
	const streak = $derived(currentStreak(sessions));
	const hours = $derived(totalDeepWorkSec(sessions) / 3600);
	const dayOfWeek = $derived(new Date().getDay());
	const isMonday = $derived(dayOfWeek === 1);

	const goalPct = $derived(
		settings.weeklyGoal > 0 ? Math.min(1, week / settings.weeklyGoal) : 0
	);

	const greatest = $derived(
		work
			.filter((s) => s.focusRating)
			.sort((a, b) => (b.focusRating ?? 0) - (a.focusRating ?? 0))
			.slice(0, 3)
	);
</script>

<h1>weekly review</h1>

{#if !loaded}
	<p class="dim">loading…</p>
{:else if work.length === 0}
	<p class="dim">Complete your first session to see this view.</p>
{:else}
	{#if isMonday}
		<div class="fresh">
			<strong>Fresh start.</strong> A new week is a small window of opportunity for habit change
			(Dai & Milkman). Pick one thing to focus on.
		</div>
	{/if}

	<section>
		<h2>this week</h2>
		<div class="goal">
			<div class="bar"><div class="fill" style="width: {goalPct * 100}%"></div></div>
			<div class="meta">
				<strong>{week}</strong> of <strong>{settings.weeklyGoal}</strong> sessions
			</div>
		</div>
	</section>

	<div class="grid">
		<div class="card">
			<div class="big">{streak}</div>
			<div class="lbl">day streak</div>
			<small>{compassionateStreak}</small>
		</div>
		<div class="card">
			<div class="big">{hours.toFixed(1)}h</div>
			<div class="lbl">deep work total</div>
		</div>
		<div class="card">
			<div class="big">{work.length}</div>
			<div class="lbl">sessions ever</div>
		</div>
	</div>

	{#if greatest.length}
		<section>
			<h2>your best sessions</h2>
			<ul>
				{#each greatest as s}
					<li>
						<strong>focus {s.focusRating}</strong>
						<span>{s.task}</span>
						<span class="when">{new Date(s.startedAt).toLocaleDateString()}</span>
					</li>
				{/each}
			</ul>
			<small>What did these have in common? Time of day? Task type? That's your signal.</small>
		</section>
	{/if}
{/if}

<style>
	h1 {
		font-weight: 500;
		font-size: 1.5rem;
		margin: 0 0 1.5rem;
	}
	h2 {
		font-weight: 500;
		font-size: 1rem;
		color: var(--text-dim);
		margin: 0 0 0.75rem;
	}
	.dim {
		color: var(--text-faint);
	}
	.fresh {
		background: var(--surface);
		border: 1px solid var(--accent-soft);
		border-radius: var(--radius-lg);
		padding: 1rem 1.15rem;
		margin-bottom: 1.5rem;
		color: var(--text);
	}
	section {
		margin-bottom: 1.5rem;
	}
	.goal {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.15rem;
	}
	.bar {
		height: 10px;
		background: var(--surface-2);
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--accent);
		transition: width 250ms ease;
	}
	.meta {
		margin-top: 0.5rem;
		color: var(--text-dim);
		font-size: 0.9rem;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.big {
		font-size: 1.75rem;
		font-weight: 300;
	}
	.lbl {
		color: var(--text-faint);
		font-size: 0.8rem;
	}
	small {
		color: var(--text-faint);
		font-size: 0.75rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	ul li {
		display: grid;
		grid-template-columns: 5rem 1fr auto;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-size: 0.9rem;
	}
	.when {
		color: var(--text-faint);
		font-size: 0.8rem;
	}
</style>
