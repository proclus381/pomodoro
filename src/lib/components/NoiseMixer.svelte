<script lang="ts">
	import { noise, toggleSound, setVolume } from '$lib/stores/noise.svelte';
	import type { SoundId } from '$lib/audio/loop-manager';

	const sounds: { id: SoundId; label: string; hint: string }[] = [
		{ id: 'brown', label: 'brown', hint: 'low rumble · masks office noise well' },
		{ id: 'pink', label: 'pink', hint: 'softer balance · easier on the ears' },
		{ id: 'white', label: 'white', hint: 'bright hiss · masks speech aggressively' }
	];
</script>

<div class="mixer" aria-label="Ambient sound">
	<div class="title">ambient</div>
	{#each sounds as s}
		<div class="row">
			<button
				class:on={noise.active[s.id]}
				class="toggle"
				onclick={() => toggleSound(s.id)}
				aria-pressed={noise.active[s.id]}
			>
				{s.label}
			</button>
			<input
				type="range"
				min="0"
				max="1"
				step="0.02"
				value={noise.volumes[s.id]}
				oninput={(e) => setVolume(s.id, +(e.currentTarget as HTMLInputElement).value)}
				disabled={!noise.active[s.id]}
				aria-label="{s.label} volume"
			/>
		</div>
	{/each}
	<small>generated locally · no music with lyrics by design</small>
</div>

<style>
	.mixer {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 0.85rem 1rem 0.95rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		min-width: 240px;
	}
	.title {
		font-size: 0.75rem;
		color: var(--text-faint);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.row {
		display: grid;
		grid-template-columns: 70px 1fr;
		gap: 0.6rem;
		align-items: center;
	}
	.toggle {
		font-size: 0.85rem;
		padding: 0.3rem 0.5rem;
	}
	.toggle.on {
		background: var(--accent);
		color: #1a1a1a;
		border-color: var(--accent);
	}
	input[type='range'] {
		padding: 0;
	}
	small {
		color: var(--text-faint);
		font-size: 0.72rem;
	}
</style>
