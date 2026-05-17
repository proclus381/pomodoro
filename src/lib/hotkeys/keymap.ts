export interface Hotkey {
	combo: string;
	label: string;
	description: string;
}

export const HOTKEYS: Hotkey[] = [
	{ combo: 'Enter', label: 'Enter', description: 'Start / advance' },
	{ combo: 'p', label: 'P (hold)', description: 'Pause (hold 1.5s)' },
	{ combo: 'k', label: 'K', description: 'Open Park-it pad during session' },
	{ combo: 'Esc', label: 'Esc', description: 'Close panel / cancel' },
	{ combo: '?', label: '?', description: 'Show this help' },
	{ combo: 's', label: 'S', description: 'Skip to break (work blocks)' },
	{ combo: 'd', label: 'D', description: 'Toggle Do-Not-Disturb' }
];
