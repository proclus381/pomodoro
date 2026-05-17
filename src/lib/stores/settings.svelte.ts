import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

interface SettingsState {
	theme: Theme;
	reducedMotion: boolean;
	highContrast: boolean;
	bellVolume: number;
	defaultPresetId: string;
	notificationsEnabled: boolean;
	dndDefault: boolean;
	weeklyGoal: number;
	vacationMode: boolean;
}

const STORAGE_KEY = 'pomodoro:settings';

function load(): SettingsState {
	const defaults: SettingsState = {
		theme: 'dark',
		reducedMotion: false,
		highContrast: false,
		bellVolume: 0.4,
		defaultPresetId: 'classic',
		notificationsEnabled: false,
		dndDefault: true,
		weeklyGoal: 20,
		vacationMode: false
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

export const settings = $state<SettingsState>(load());

export function persistSettings() {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		document.documentElement.dataset.theme = settings.theme;
	} catch {
		// Safari private mode: silently drop
	}
}

export function applyThemeToDom() {
	if (!browser) return;
	document.documentElement.dataset.theme = settings.theme;
}
