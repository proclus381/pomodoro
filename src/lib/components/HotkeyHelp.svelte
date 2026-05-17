<script lang="ts">
	import { HOTKEYS } from '$lib/hotkeys/keymap';
	interface Props {
		open: boolean;
		onclose: () => void;
	}
	let { open = $bindable(), onclose }: Props = $props();

	function close() {
		open = false;
		onclose();
	}
</script>

{#if open}
	<div
		class="overlay"
		onclick={close}
		role="presentation"
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div
			class="panel"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-label="Hotkeys"
			tabindex="-1"
		>
			<header>
				<strong>Keyboard</strong>
				<button class="ghost" onclick={close}>esc</button>
			</header>
			<ul>
				{#each HOTKEYS as h}
					<li>
						<kbd>{h.label}</kbd>
						<span>{h.description}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 60;
	}
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		min-width: 320px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	li {
		display: grid;
		grid-template-columns: 90px 1fr;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.9rem;
		color: var(--text-dim);
	}
</style>
