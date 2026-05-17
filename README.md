# Pomodoro Deep Work

A research-optimized focus timer. Calm UI. Local-first. No accounts, no tracking, no flashy gamification.

## Why another Pomodoro app

Most Pomodoro apps are 25/5 countdowns dressed up with leaderboards and notifications. This one tries to actually operationalize what concentration research says: implementation intentions before the bell, intrusive-thought capture during the session, microbreak prompts that *aren't* a content feed, and analytics that surface your own peak hours instead of comparing you to strangers.

See `/root/.claude/plans/what-features-does-a-mutable-eich.md` (planning doc) for the full feature ↔ research mapping.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site → /build
pnpm test       # vitest unit tests
```

## Tech

SvelteKit (static adapter) · Svelte 5 runes · Dexie (IndexedDB) · Web Audio API · vite-plugin-pwa · TypeScript.

## Structure

```
/src/lib
  /components   UI pieces (Timer, Ritual, BreakScreen, ParkIt, NoiseMixer, …)
  /stores       *.svelte.ts state modules
  /db           Dexie schema + queries
  /audio        noise generators + loop manager
  /research     evidence-based microcopy
/src/routes     SvelteKit routes: /, /history, /review, /settings
/extension      Optional MV3 companion blocker (separate build)
/tests          Vitest unit tests
```

## Design constraints

- No music with lyrics — only generated noise.
- No leaderboards, no social, no shame.
- Notifications only for the end-of-block bell.
- Everything stored locally. Export anytime as JSON or CSV.
- No telemetry. No external requests at runtime.
