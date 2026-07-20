# Ink and Time

A minimalist, local-first to-do list and habit-tracking application designed to emulate the tactile, warm satisfaction of an analog paper journal while integrating dynamic digital mechanics.

## 🚀 Tech Stack

*   **Framework:** Next.js (App Router) + React
*   **Styling:** Tailwind CSS + Framer Motion (for ink-fill micro-interactions)
*   **Local Database:** Dexie.js (IndexedDB wrapper)
*   **Backend & Sync:** Supabase (PostgreSQL)
*   **Deployment:** Vercel (Edge-optimized)

## ✨ Core Features

*   **Analog Journal Canvas:** An off-white/cream UI (`#F4F1EA`) with an SVG noise/grain overlay to eliminate stark digital glare.
*   **Zero-Latency Data Layer:** Offline-first architecture. All task operations (create, toggle, delete) update local state immediately and sync to Supabase non-blockingly in the background.
*   **Dynamic Streak Heatmap:** A GitHub-style activity contribution matrix. The heatmap renders in constant time via a pre-calculated `daily_activity` aggregate table.
*   **Resilient Focus Engine:** A pristine Pomodoro timer UI that uses absolute timestamp diffing (`Date.now() + duration`) to survive mobile OS background throttling and browser tab unmounting.
*   **Dual-Tier Audio Integration:** OAuth 2.0 PKCE flow for Spotify integration (Premium in-app mini-player) falling back to bundled, seamless-looping local ambient tracks (Rain, Brown Noise) for free users.
