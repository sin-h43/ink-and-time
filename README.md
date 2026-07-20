# doME — a hybrid to-do journal

A local-first, doME-journal styled to-do list: frictionless quick-add, a
GitHub-style streak heatmap, a monthly calendar with a doodle-sticker board,
and a Focus/Pomodoro mode. Built with Next.js (App Router), Dexie
(IndexedDB), and lucide-react.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. On first run it seeds a week of demo tasks so
the streak heatmap and calendar aren't empty — real data you add takes over
from there and lives in your browser's IndexedDB.

## What's actually working

- **Local-first storage** — every task, doodle, and toggle writes straight
  to IndexedDB via Dexie (`lib/db.ts`, `lib/useTasks.ts`,
  `lib/useDoodles.ts`). No network round trip, no loading spinners on
  writes. Data survives refreshes and closing the tab.
- **Today / Calendar / Focus** — same three views from the prototype, now
  reading and writing the same underlying task table, so an event you add
  from the calendar shows up in Today's schedule and in Focus's task list,
  and vice versa.
- **PWA** — `public/manifest.json` + the `manifest` link in
  `app/layout.tsx` make this installable to a phone home screen (Add to
  Home Screen in Safari, or the install icon in Chrome). The placeholder
  icons in `public/icons/` are just a plain "A" mark — swap them for real
  artwork before you ship.

## What's intentionally stubbed (and why)

I can't create working cloud credentials from inside a sandbox, so these
are scaffolded but not wired to a live backend:

- **Supabase sync** (`lib/supabaseSync.ts`) — every task already has a
  `synced` flag ready for this. The function reads pending rows and logs a
  warning instead of pushing them anywhere. Follow the comments at the top
  of that file to connect your own Supabase project.
- **Spotify** (`lib/spotify.ts`) — the PKCE code-verifier/challenge
  generation and the login redirect are real, working browser crypto. The
  token exchange has to happen server-side with your Spotify app's client
  secret, which needs its own API route (`app/api/spotify/callback/route.ts`)
  that doesn't exist yet. Comments in the file walk through the remaining
  steps.

Also worth knowing:

- **Mood** is currently session-only state, not persisted. If you want it
  saved, add a small `moods` table to `lib/db.ts` (`date` as the primary
  key) the same way `tasks` and `doodles` are set up.
- **Streak heatmap** aggregates from the `tasks` table client-side on every
  render (see the comment in `components/doMETodoApp.tsx` above
  `YearHeatmap`). The PRD describes a dedicated `daily_activity` aggregate
  table for O(1) rendering at scale — worth adding once task volume is
  large enough for the scan to actually matter.

## Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

Or connect the repo at vercel.com/new. No environment variables are
required for the base app to work — only add the ones in
`.env.local.example` once you've wired up Supabase/Spotify.

## Project layout

```
app/                  Next.js App Router pages + global styles
components/
  doMETodoApp.tsx    the whole UI — Today, Calendar, Focus
lib/
  db.ts               Dexie (IndexedDB) schema
  useTasks.ts          local-first task read/write hook
  useDoodles.ts         local-first calendar-sticker hook
  supabaseSync.ts       cloud sync stub
  spotify.ts             Spotify OAuth PKCE stub
public/
  manifest.json         PWA manifest
  icons/                 placeholder app icons
```
