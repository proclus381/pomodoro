<script lang="ts">
	import { onMount } from 'svelte';
	import { listSessions } from '$lib/db/queries';
	import {
		byDay,
		byHour,
		byPreset,
		workSessions,
		totalDeepWorkSec,
		sessionsThisWeek
	} from '$lib/analytics';
	import type { Session } from '$lib/db/schema';

	let sessions = $state<Session[]>([]);
	let loaded = $state(false);

	onMount(async () => {
		sessions = await listSessions();
		loaded = true;
	});

	const work = $derived(workSessions(sessions));
	const totalHours = $derived(totalDeepWorkSec(sessions) / 3600);
	const week = $derived(sessionsThisWeek(sessions));
	const daily = $derived(byDay(sessions).slice(-30));
	const hourly = $derived(byHour(sessions));
	const presets = $derived(byPreset(sessions));
	const maxDay = $derived(Math.max(1, ...daily.map((d) => d.count)));
	const maxHour = $derived(Math.max(1, ...hourly.map((h) => h.count)));
</script>

<h1>history</h1>

{#if !loaded}
	<p class="dim">loading…</p>
{:else if work.length === 0}
	<p class="dim">No completed sessions yet. Your data lives only on this device.</p>
{:else}
	<div class="stats">
		<div class="stat">
			<div class="num">{work.length}</div>
			<div class="lbl">sessions</div>
		</div>
		<div class="stat">
			<div class="num">{totalHours.toFixed(1)}h</div>
			<div class="lbl">deep work</div>
		</div>
		<div class="stat">
			<div class="num">{week}</div>
			<div class="lbl">this week</div>
		</div>
	</div>

	<section>
		<h2>last 30 days</h2>
		<div class="bars">
			{#each daily as d}
				<div class="bar-col" title="{d.dateKey}: {d.count} sessions">
					<div class="bar" style="height: {(d.count / maxDay) * 100}%"></div>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<h2>your peak hours</h2>
		<div class="heatmap">
			{#each hourly as h}
				<div
					class="cell"
					title="{h.hour}:00 — {h.count} sessions{h.avgFocus
						? `, focus ${h.avgFocus.toFixed(1)}`
						: ''}"
					style="background: rgba(201,169,110,{(h.count / maxHour) * 0.85 + 0.05})"
				>
					<span>{h.hour}</span>
				</div>
			{/each}
		</div>
		<small>Darker = more sessions completed at that hour. Look for your patterns.</small>
	</section>

	<section>
		<h2>which length works for you</h2>
		<ul class="preset-list">
			{#each presets as p}
				<li>
					<span class="name">{p.preset}</span>
					<span class="count">{p.count} sessions</span>
					{#if p.avgFocus !== null}
						<span class="focus">avg focus {p.avgFocus.toFixed(2)}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>recent sessions</h2>
		<ul class="sessions">
			{#each work.slice(0, 25) as s}
				<li>
					<span class="when">{new Date(s.startedAt).toLocaleString()}</span>
					<span class="task">{s.task}</span>
					<span class="meta">
						{Math.round(s.actualDurationSec / 60)}m
						{#if s.focusRating}· focus {s.focusRating}{/if}
						{#if s.tag}· {s.tag}{/if}
					</span>
				</li>
			{/each}
		</ul>
	</section>
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
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.stat {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem;
		text-align: center;
	}
	.num {
		font-size: 1.75rem;
		font-weight: 300;
	}
	.lbl {
		color: var(--text-faint);
		font-size: 0.8rem;
	}
	section {
		margin-bottom: 2rem;
	}
	.bars {
		display: flex;
		gap: 3px;
		align-items: flex-end;
		height: 100px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.5rem;
	}
	.bar-col {
		flex: 1;
		display: flex;
		align-items: flex-end;
		min-width: 4px;
	}
	.bar {
		width: 100%;
		background: var(--accent);
		border-radius: 2px 2px 0 0;
		min-height: 2px;
	}
	.heatmap {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 4px;
	}
	.cell {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		color: var(--text);
		border-radius: 4px;
	}
	.preset-list,
	.sessions {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.preset-list li {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.preset-list .name {
		font-weight: 500;
	}
	.preset-list .count {
		color: var(--text-dim);
	}
	.preset-list .focus {
		color: var(--accent);
	}
	.sessions li {
		display: grid;
		grid-template-columns: 12rem 1fr auto;
		gap: 0.75rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.9rem;
	}
	.when {
		color: var(--text-faint);
		font-size: 0.82rem;
	}
	.meta {
		color: var(--text-dim);
		font-size: 0.82rem;
	}
	small {
		color: var(--text-faint);
		font-size: 0.78rem;
	}
</style>
