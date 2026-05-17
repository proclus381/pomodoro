<script lang="ts">
	import { addParkItNote } from '$lib/db/queries';
	import { timer } from '$lib/stores/timer.svelte';
	import { parkItExplain } from '$lib/research/copy';

	interface Props {
		open: boolean;
		onclose: () => void;
	}
	let { open = $bindable(), onclose }: Props = $props();

	let text = $state('');
	let textarea = $state<HTMLTextAreaElement | undefined>(undefined);

	$effect(() => {
		if (open) {
			queueMicrotask(() => textarea?.focus());
		} else {
			text = '';
		}
	});

	async function save() {
		const t = text.trim();
		if (!t || !timer.currentSessionId) {
			close();
			return;
		}
		await addParkItNote({
			sessionId: timer.currentSessionId,
			createdAt: Date.now(),
			text: t
		});
		close();
	}

	function close() {
		open = false;
		onclose();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}
		if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || (e.key === 'Enter' && !e.shiftKey)) {
			e.preventDefault();
			save();
		}
	}
</script>

{#if open}
	<div class="overlay" role="dialog" aria-label="Park it">
		<div class="panel">
			<header>
				<strong>Park it</strong>
				<button class="ghost" onclick={close} aria-label="Close">esc</button>
			</header>
			<textarea
				bind:this={textarea}
				bind:value={text}
				rows="3"
				placeholder="The thought that just interrupted you…"
				onkeydown={onKey}
			></textarea>
			<div class="row">
				<small>{parkItExplain}</small>
				<button class="primary" onclick={save}>save · ↵</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(2px);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 12vh;
		z-index: 50;
	}
	.panel {
		width: min(520px, 92vw);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}
	small {
		color: var(--text-faint);
		font-size: 0.78rem;
	}
	textarea {
		resize: vertical;
	}
</style>
