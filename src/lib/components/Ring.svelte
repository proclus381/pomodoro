<script lang="ts">
	interface Props {
		progress: number; // 0..1
		size?: number;
		stroke?: number;
		color?: string;
		track?: string;
	}
	let {
		progress,
		size = 320,
		stroke = 8,
		color = 'var(--accent)',
		track = 'var(--border)'
	}: Props = $props();

	const r = $derived((size - stroke) / 2);
	const circ = $derived(2 * Math.PI * r);
	const dash = $derived(circ * (1 - Math.min(1, Math.max(0, progress))));
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
	<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} stroke-width={stroke} />
	<circle
		cx={size / 2}
		cy={size / 2}
		r={r}
		fill="none"
		stroke={color}
		stroke-width={stroke}
		stroke-linecap="round"
		stroke-dasharray={circ}
		stroke-dashoffset={dash}
		transform="rotate(-90 {size / 2} {size / 2})"
		style="transition: stroke-dashoffset 250ms linear"
	/>
</svg>
