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

  

Also worth knowing:

- **Mood** is currently session-only state, not persisted. If you want it
  saved, add a small `moods` table to `lib/db.ts` (`date` as the primary
  key) the same way `tasks` and `doodles` are set up.
- **Streak heatmap** aggregates from the `tasks` table client-side on every
  render (see the comment in `components/doMETodoApp.tsx` above
  `YearHeatmap`). The PRD describes a dedicated `daily_activity` aggregate
  table for O(1) rendering at scale — worth adding once task volume is
  large enough for the scan to actually matter.




