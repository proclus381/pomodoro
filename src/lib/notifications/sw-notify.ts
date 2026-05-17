import { browser } from '$app/environment';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!browser || !('Notification' in window)) return 'denied';
	if (Notification.permission === 'granted') return 'granted';
	if (Notification.permission === 'denied') return 'denied';
	return Notification.requestPermission();
}

export async function notify(title: string, body: string) {
	if (!browser || !('Notification' in window)) return;
	if (Notification.permission !== 'granted') return;
	try {
		if ('serviceWorker' in navigator) {
			const reg = await navigator.serviceWorker.ready;
			await reg.showNotification(title, {
				body,
				icon: '/icons/icon-192.png',
				badge: '/icons/icon-192.png',
				silent: false,
				tag: 'pomodoro-bell'
			});
			return;
		}
	} catch {
		// fall through to direct
	}
	try {
		new Notification(title, { body });
	} catch {
		// no-op
	}
}
