<script lang="ts">
	import { timer } from '$lib/stores/timer.svelte';
	import { updateSession } from '$lib/db/queries';

	interface Props {
		oncontinue: () => void;
	}
	let { oncontinue }: Props = $props();

	let focus = $state<1 | 2 | 3 | 4 | 5 | null>(null);
	let difficulty = $state<1 | 2 | 3 | 4 | 5 | null>(null);
	let status = $state<'done' | 'continue' | 'abandon'>('continue');
	let note = $state('');

	async function save() {
		const id = timer.currentSessionId;
		if (id) {
			await updateSession(id, {
				focusRating: focus ?? undefined,
				difficultyRating: difficulty ?? undefined,
				taskStatus: status,
				note: note.trim() || undefined
			});
		}
		oncontinue();
	}
</script>

<div class="log">
	<h2>How was that?</h2>
	<p class="task">{timer.currentTask}</p>

	<section>
		<div class="lbl">Focus quality</div>
		<div class="scale">
			{#each [1, 2, 3, 4, 5] as n}
				<button
					class:on={focus === n}
					onclick={() => (focus = n as 1 | 2 | 3 | 4 | 5)}
					aria-label="Focus {n}"
				>
					{n}
				</button>
			{/each}
		</div>
		<small>1 = scattered · 5 = locked in</small>
	</section>

	<section>
		<div class="lbl">Difficulty</div>
		<div class="scale">
			{#each [1, 2, 3, 4, 5] as n}
				<button
					class:on={difficulty === n}
					onclick={() => (difficulty = n as 1 | 2 | 3 | 4 | 5)}
					aria-label="Difficulty {n}"
				>
					{n}
				</button>
			{/each}
		</div>
		<small>1 = too easy · 3 = sweet spot · 5 = too hard</small>
	</section>

	<section>
		<div class="lbl">Task is</div>
		<div class="row">
			<button class:on={status === 'done'} onclick={() => (status = 'done')}>done</button>
			<button class:on={status === 'continue'} onclick={() => (status = 'continue')}>
				continue next session
			</button>
			<button class:on={status === 'abandon'} onclick={() => (status = 'abandon')}>abandon</button>
		</div>
	</section>

	<section>
		<label for="note">Note (optional)</label>
		<input id="note" bind:value={note} placeholder="anything to remember…" maxlength="200" />
	</section>

	<div class="actions">
		<button class="primary" onclick={save}>continue to break →</button>
	</div>
</div>

<style>
	.log {
		max-width: 540px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	h2 {
		font-weight: 500;
		font-size: 1.5rem;
		margin: 0;
	}
	.task {
		color: var(--text-dim);
		margin: 0;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	label,
	.lbl {
		font-size: 0.85rem;
		color: var(--text-dim);
	}
	.scale {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.5rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	button.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #1a1a1a;
	}
	small {
		color: var(--text-faint);
		font-size: 0.75rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
	}
</style>
