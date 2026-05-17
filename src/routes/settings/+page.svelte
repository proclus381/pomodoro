<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, persistSettings, applyThemeToDom } from '$lib/stores/settings.svelte';
	import { PRESETS } from '$lib/stores/timer.svelte';
	import { db } from '$lib/db/schema';
	import { exportAll, clearAll } from '$lib/db/queries';
	import { requestNotificationPermission } from '$lib/notifications/sw-notify';
	import type { BlocklistEntry } from '$lib/db/schema';

	let blocklist = $state<BlocklistEntry[]>([]);
	let newPattern = $state('');
	let permState = $state<NotificationPermission | 'unknown'>('unknown');

	onMount(async () => {
		blocklist = await db().blocklist.toArray();
		if (typeof Notification !== 'undefined') permState = Notification.permission;
	});

	function save() {
		persistSettings();
		applyThemeToDom();
	}

	async function addPattern() {
		const p = newPattern.trim().toLowerCase();
		if (!p) return;
		try {
			await db().blocklist.add({
				pattern: p,
				createdAt: Date.now(),
				hitCount: 0
			} as BlocklistEntry);
			blocklist = await db().blocklist.toArray();
			newPattern = '';
		} catch {
			// duplicate pattern; ignore
		}
	}

	async function removePattern(id: number) {
		await db().blocklist.delete(id);
		blocklist = await db().blocklist.toArray();
	}

	async function askPerms() {
		permState = await requestNotificationPermission();
	}

	async function doExport() {
		const data = await exportAll();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `pomodoro-export-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function doExportCsv() {
		const data = await exportAll();
		const rows = [
			[
				'startedAt',
				'task',
				'preset',
				'type',
				'plannedMin',
				'actualMin',
				'focus',
				'difficulty',
				'tag',
				'completed'
			].join(',')
		];
		for (const s of data.sessions) {
			rows.push(
				[
					new Date(s.startedAt).toISOString(),
					JSON.stringify(s.task ?? ''),
					s.preset,
					s.type,
					Math.round(s.plannedDurationSec / 60),
					Math.round(s.actualDurationSec / 60),
					s.focusRating ?? '',
					s.difficultyRating ?? '',
					s.tag ?? '',
					s.completed
				].join(',')
			);
		}
		const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `pomodoro-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function doClear() {
		if (!confirm('Erase all local data? This cannot be undone.')) return;
		await clearAll();
		blocklist = [];
		alert('Cleared.');
	}
</script>

<h1>settings</h1>

<section>
	<h2>Appearance</h2>
	<label class="row">
		<span>Theme</span>
		<select bind:value={settings.theme} onchange={save}>
			<option value="dark">dark</option>
			<option value="light">light</option>
		</select>
	</label>
	<label class="row">
		<span>Reduced motion</span>
		<input type="checkbox" bind:checked={settings.reducedMotion} onchange={save} />
	</label>
	<label class="row">
		<span>High contrast</span>
		<input type="checkbox" bind:checked={settings.highContrast} onchange={save} />
	</label>
</section>

<section>
	<h2>Defaults</h2>
	<label class="row">
		<span>Default length</span>
		<select bind:value={settings.defaultPresetId} onchange={save}>
			{#each PRESETS as p}
				<option value={p.id}>{p.label}</option>
			{/each}
		</select>
	</label>
	<label class="row">
		<span>Do-Not-Disturb by default</span>
		<input type="checkbox" bind:checked={settings.dndDefault} onchange={save} />
	</label>
	<label class="row">
		<span>Weekly session goal</span>
		<input type="number" min="1" max="100" bind:value={settings.weeklyGoal} onchange={save} />
	</label>
	<label class="row">
		<span>Vacation mode (no streak shame)</span>
		<input type="checkbox" bind:checked={settings.vacationMode} onchange={save} />
	</label>
</section>

<section>
	<h2>Sound</h2>
	<label class="row">
		<span>Bell volume</span>
		<input
			type="range"
			min="0"
			max="1"
			step="0.05"
			bind:value={settings.bellVolume}
			onchange={save}
		/>
	</label>
</section>

<section>
	<h2>Notifications</h2>
	<div class="row">
		<span>Browser notifications</span>
		<div>
			<span class="dim">{permState}</span>
			{#if permState !== 'granted'}
				<button class="ghost" onclick={askPerms}>request</button>
			{/if}
		</div>
	</div>
	<small>Only used for the end-of-block bell when the tab is in the background.</small>
</section>

<section>
	<h2>Distraction blocklist (soft block)</h2>
	<p class="dim">
		The app shows a calm interstitial when you navigate to these from within the app. For
		browser-level blocking, install a companion extension (planned).
	</p>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			addPattern();
		}}
		class="row"
	>
		<input bind:value={newPattern} placeholder="e.g. twitter.com" />
		<button type="submit" class="primary">add</button>
	</form>
	{#if blocklist.length}
		<ul class="bl">
			{#each blocklist as b}
				<li>
					<span class="pat">{b.pattern}</span>
					<span class="hits">{b.hitCount} attempts</span>
					<button class="ghost" onclick={() => removePattern(b.id!)}>remove</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section>
	<h2>Your data</h2>
	<p class="dim">
		Everything is stored locally in your browser. We send nothing to any server. No accounts, no
		analytics, no telemetry.
	</p>
	<div class="actions">
		<button class="ghost" onclick={doExport}>export JSON</button>
		<button class="ghost" onclick={doExportCsv}>export CSV</button>
		<button class="ghost danger" onclick={doClear}>erase all</button>
	</div>
</section>

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
	section {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.15rem;
		margin-bottom: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}
	.row > span {
		flex: 1;
	}
	.row input,
	.row select {
		max-width: 220px;
		width: auto;
	}
	.dim {
		color: var(--text-faint);
		font-size: 0.85rem;
		margin: 0;
	}
	small {
		color: var(--text-faint);
		font-size: 0.78rem;
	}
	.bl {
		list-style: none;
		padding: 0;
		margin: 0.25rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.bl li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.5rem;
		align-items: center;
		padding: 0.4rem 0.6rem;
		background: var(--surface-2);
		border-radius: var(--radius);
	}
	.pat {
		font-family: var(--mono);
		font-size: 0.9rem;
	}
	.hits {
		color: var(--text-faint);
		font-size: 0.8rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.danger {
		color: var(--danger);
	}
</style>
