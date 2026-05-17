import { browser } from '$app/environment';
import { audio, type SoundId } from '$lib/audio/loop-manager';

interface NoiseState {
	volumes: Record<SoundId, number>;
	active: Record<SoundId, boolean>;
}

const STORAGE_KEY = 'pomodoro:noise';

function load(): NoiseState {
	const defaults: NoiseState = {
		volumes: { white: 0.3, pink: 0.3, brown: 0.4 },
		active: { white: false, pink: false, brown: false }
	};
	if (!browser) return defaults;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return defaults;
		return { ...defaults, ...JSON.parse(raw) };
	} catch {
		return defaults;
	}
}

export const noise = $state<NoiseState>(load());

export function persistNoise() {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(noise));
	} catch {
		// ignore
	}
}

export async function toggleSound(id: SoundId) {
	if (noise.active[id]) {
		audio.stop(id);
		noise.active[id] = false;
	} else {
		await audio.play(id, noise.volumes[id]);
		noise.active[id] = true;
	}
	persistNoise();
}

export function setVolume(id: SoundId, v: number) {
	noise.volumes[id] = v;
	if (noise.active[id]) audio.setVolume(id, v);
	persistNoise();
}

export function stopAllSounds() {
	audio.stopAll();
	for (const id of Object.keys(noise.active) as SoundId[]) {
		noise.active[id] = false;
	}
	persistNoise();
}
