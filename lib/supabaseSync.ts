// Background sync stub.
//
// This app is local-first: every read/write in lib/useTasks.ts already goes straight to
// IndexedDB (via Dexie), so the UI never waits on the network. This file is where you'd
// wire up the *non-blocking* push to Supabase described in the PRD.
//
// Not implemented here because it needs your own Supabase project — there's no way to
// create working credentials from inside this sandbox. Steps to finish it:
//
// 1. npm install @supabase/supabase-js
// 2. Create a Supabase project, then add to .env.local:
//      NEXT_PUBLIC_SUPABASE_URL=...
//      NEXT_PUBLIC_SUPABASE_ANON_KEY=...
// 3. Create a `tasks` table in Supabase mirroring lib/db.ts's Task shape (use `uid` as the
//    primary key so local IDs never collide across devices).
// 4. Implement syncPendingTasks() below: query Dexie for `synced === false` rows, upsert them
//    to Supabase, then mark them synced locally. Call it on an interval and on `online` events.

import { db } from "./db";

export async function syncPendingTasks(): Promise<void> {
  const pending = await db.tasks.where("synced").equals(0).toArray();
  if (pending.length === 0) return;

  console.warn(
    `syncPendingTasks(): ${pending.length} task(s) waiting to sync, but no Supabase client is configured yet.`
  );

  // Example of what the real implementation looks like once Supabase is wired up:
  //
  // const { data, error } = await supabase.from("tasks").upsert(
  //   pending.map((t) => ({ ...t, id: undefined })) // let Supabase assign its own row id
  // );
  // if (!error) {
  //   await db.tasks.bulkUpdate(pending.map((t) => ({ key: t.id!, changes: { synced: true } })));
  // }
}
