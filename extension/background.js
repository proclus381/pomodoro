// MV3 background service worker.
// Reads the user's blocklist + active-session flag from chrome.storage.sync
// (written by the PWA via a content-script bridge or the extension's own
// options page) and updates dynamic declarativeNetRequest rules accordingly.

const RULE_ID_BASE = 1000;

async function syncRules() {
	const { blocklist = [], focusActive = false } = await chrome.storage.sync.get([
		'blocklist',
		'focusActive'
	]);

	const existing = await chrome.declarativeNetRequest.getDynamicRules();
	const removeRuleIds = existing.map((r) => r.id);

	let addRules = [];
	if (focusActive && blocklist.length) {
		addRules = blocklist.map((pattern, i) => ({
			id: RULE_ID_BASE + i,
			priority: 1,
			action: { type: 'block' },
			condition: {
				urlFilter: pattern,
				resourceTypes: ['main_frame']
			}
		}));
	}

	await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}

chrome.runtime.onInstalled.addListener(syncRules);
chrome.runtime.onStartup.addListener(syncRules);
chrome.storage.onChanged.addListener((_changes, area) => {
	if (area === 'sync') syncRules();
});
