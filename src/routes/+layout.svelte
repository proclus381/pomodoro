<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { applyThemeToDom } from '$lib/stores/settings.svelte';

	let { children } = $props();

	onMount(() => {
		applyThemeToDom();
	});
</script>

<div class="shell">
	<header class="nav">
		<a href="/" class="brand" class:active={$page.url.pathname === '/'}>focus</a>
		<nav>
			<a href="/history" class:active={$page.url.pathname === '/history'}>history</a>
			<a href="/review" class:active={$page.url.pathname === '/review'}>review</a>
			<a href="/settings" class:active={$page.url.pathname === '/settings'}>settings</a>
		</nav>
	</header>
	<main>
		{@render children()}
	</main>
	<footer>
		<span>local-first · no tracking · v0.1</span>
	</footer>
</div>

<style>
	.shell {
		max-width: 880px;
		margin: 0 auto;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		padding: 0 1.25rem;
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 0;
		border-bottom: 1px solid var(--border);
	}
	.brand {
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text);
	}
	nav {
		display: flex;
		gap: 1.25rem;
	}
	nav a,
	.brand {
		color: var(--text-dim);
		text-decoration: none;
		font-size: 0.95rem;
	}
	nav a:hover,
	.brand:hover {
		color: var(--text);
	}
	nav a.active,
	.brand.active {
		color: var(--text);
	}
	main {
		flex: 1;
		padding: 2rem 0;
	}
	footer {
		padding: 1.5rem 0;
		font-size: 0.8rem;
		color: var(--text-faint);
		text-align: center;
		border-top: 1px solid var(--border);
	}
</style>
