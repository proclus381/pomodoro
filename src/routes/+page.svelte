<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { timer, startTick, stopTick } from '$lib/stores/timer.svelte';
	import Ritual from '$lib/components/Ritual.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import PostLog from '$lib/components/PostLog.svelte';
	import BreakScreen from '$lib/components/BreakScreen.svelte';
	import NoiseMixer from '$lib/components/NoiseMixer.svelte';
	import HotkeyHelp from '$lib/components/HotkeyHelp.svelte';
	import { stopAllSounds } from '$lib/stores/noise.svelte';
	import { requestNotificationPermission } from '$lib/notifications/sw-notify';

	let helpOpen = $state(false);
	let permPrompted = $state(false);

	onMount(() => {
		startTick();
		window.addEventListener('keydown', onGlobalKey);
	});

	onDestroy(() => {
		stopTick();
		stopAllSounds();
		window.removeEventListener('keydown', onGlobalKey);
	});

	function onGlobalKey(e: KeyboardEvent) {
		if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
		if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
			e.preventDefault();
			helpOpen = !helpOpen;
		}
	}

	function toPostLogToBreak() {
		// after post-log, move to break-prompt
		timer.phase = 'break-prompt';
	}

	async function maybeAskPerms() {
		if (permPrompted) return;
		permPrompted = true;
		await requestNotificationPermission();
	}
</script>

<div class="page">
	{#if timer.phase === 'idle'}
		<Ritual />
		<aside class="side">
			<NoiseMixer />
			<button class="ghost help" onclick={() => (helpOpen = true)}>keyboard help · ?</button>
			<button class="ghost help" onclick={maybeAskPerms}>enable notifications</button>
		</aside>
	{:else if timer.phase === 'ritual'}
		<Ritual />
	{:else if timer.phase === 'work'}
		<Timer />
		<aside class="side">
			<NoiseMixer />
		</aside>
	{:else if timer.phase === 'log'}
		<PostLog oncontinue={toPostLogToBreak} />
	{:else if timer.phase === 'break-prompt' || timer.phase === 'break'}
		<BreakScreen />
	{/if}
</div>

<HotkeyHelp bind:open={helpOpen} onclose={() => (helpOpen = false)} />

<style>
	.page {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		align-items: start;
	}
	@media (min-width: 720px) {
		.page {
			grid-template-columns: 1fr auto;
		}
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.help {
		justify-content: flex-start;
		font-size: 0.85rem;
		color: var(--text-faint);
	}
</style>
