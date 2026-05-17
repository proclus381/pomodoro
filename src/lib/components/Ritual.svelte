<script lang="ts">
	import { onMount } from 'svelte';
	import { PRESETS, beginRitual, startWork, timer } from '$lib/stores/timer.svelte';
	import { createSession, upsertRecentTask, recentTasks } from '$lib/db/queries';
	import { settings } from '$lib/stores/settings.svelte';
	import { ritualIntention } from '$lib/research/copy';

	let task = $state('');
	let dod = $state('');
	let tag = $state('');
	let presetId = $state(settings.defaultPresetId);
	let dnd = $state(settings.dndDefault);
	let recent = $state<{ text: string; tag?: string }[]>([]);
	let countdown = $state(0);
	let counting = $state(false);
	let countHandle: ReturnType<typeof setInterval> | null = null;

	const preset = $derived(PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]);
	const valid = $derived(task.trim().length > 0 && dod.trim().length > 0);
	const wouldNeedSplit = $derived(false);

	onMount(async () => {
		recent = (await recentTasks(6)).map((r) => ({ text: r.text, tag: r.tag }));
	});

	async function beginCountdown() {
		if (!valid) return;
		beginRitual(preset, task, dod, tag, dnd);
		counting = true;
		countdown = 10;
		countHandle = setInterval(() => {
			countdown -= 1;
			if (countdown <= 0) {
				if (countHandle) clearInterval(countHandle);
				countHandle = null;
				go();
			}
		}, 1000);
	}

	async function go() {
		const startedAt = Date.now();
		const id = await createSession({
			startedAt,
			endedAt: null,
			plannedDurationSec: preset.workSec,
			actualDurationSec: 0,
			type: 'work',
			preset: preset.id,
			task: task.trim(),
			definitionOfDone: dod.trim(),
			tag: tag.trim() || undefined,
			interruptionCount: 0,
			parkItNoteIds: [],
			completed: false
		});
		await upsertRecentTask(task.trim(), tag.trim() || undefined);
		startWork(id);
	}

	function cancel() {
		if (countHandle) clearInterval(countHandle);
		countHandle = null;
		counting = false;
		countdown = 0;
		timer.phase = 'idle';
	}

	function pickRecent(t: string, g?: string) {
		task = t;
		if (g) tag = g;
	}
</script>

{#if counting}
	<div class="countdown">
		<div class="breath" style="animation-duration: {countdown >= 5 ? '4s' : '4s'}"></div>
		<div class="big">{countdown}</div>
		<div class="hint">Three slow breaths. We start at zero.</div>
		<button class="ghost" onclick={cancel}>cancel</button>
	</div>
{:else}
	<form
		class="ritual"
		onsubmit={(e) => {
			e.preventDefault();
			beginCountdown();
		}}
	>
		<h1>What are you working on?</h1>
		<label>
			<span>Task</span>
			<input
				bind:value={task}
				placeholder="e.g. draft the intro section"
				maxlength="120"
			/>
		</label>
		{#if recent.length}
			<div class="recent">
				{#each recent as r}
					<button type="button" class="ghost chip" onclick={() => pickRecent(r.text, r.tag)}>
						{r.text}
					</button>
				{/each}
			</div>
		{/if}
		<label>
			<span>Done when…</span>
			<input
				bind:value={dod}
				placeholder="e.g. three coherent paragraphs exist"
				maxlength="160"
			/>
		</label>
		<small class="why">{ritualIntention}</small>

		<div class="row">
			<label>
				<span>Tag (optional)</span>
				<input bind:value={tag} placeholder="writing" maxlength="20" />
			</label>
			<label>
				<span>Length</span>
				<select bind:value={presetId}>
					{#each PRESETS as p}
						<option value={p.id}>{p.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<label class="check">
			<input type="checkbox" bind:checked={dnd} />
			<span>Do-Not-Disturb during this block</span>
		</label>

		<div class="actions">
			<button type="submit" class="primary" disabled={!valid}>Start focus</button>
		</div>
	</form>
{/if}

<style>
	.ritual {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 540px;
		margin: 0 auto;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 500;
		margin: 0 0 0.5rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	label span {
		font-size: 0.85rem;
		color: var(--text-dim);
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.check {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--text-dim);
	}
	.check input {
		width: auto;
	}
	.why {
		color: var(--text-faint);
		font-size: 0.8rem;
	}
	.recent {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.chip {
		font-size: 0.85rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--border);
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
	.countdown {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 4rem 0;
	}
	.big {
		font-size: 4rem;
		font-variant-numeric: tabular-nums;
		color: var(--text);
	}
	.hint {
		color: var(--text-dim);
		font-size: 0.95rem;
	}
	.breath {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: radial-gradient(circle, var(--accent-soft) 0%, transparent 70%);
		opacity: 0.35;
		animation: breathe 4s ease-in-out infinite;
	}
	@keyframes breathe {
		0%,
		100% {
			transform: scale(0.85);
		}
		50% {
			transform: scale(1.15);
		}
	}
</style>
