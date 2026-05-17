# Pomodoro Blocker — companion WebExtension

Optional companion to the Pomodoro Deep Work PWA. Adds **hard** browser-level blocking of distracting sites while a focus session is running.

## Install (Chrome/Edge, unpacked)

1. Open `chrome://extensions`.
2. Enable "Developer mode" (top right).
3. Click "Load unpacked" and select this `extension/` folder.

## How it works

- Reads `blocklist` and `focusActive` from `chrome.storage.sync`.
- When both are set, registers dynamic `declarativeNetRequest` block rules.
- Removes them as soon as the focus session ends.

The PWA writes those keys via a small content-script bridge (planned for v0.2; for now the extension can be configured manually using a browser console with `chrome.storage.sync.set(...)`).

## Why a separate extension

A regular web page cannot block navigation in *other* tabs. Browser extensions can. Shipping this as an optional companion keeps the PWA install-free for users who don't need hard blocking.
