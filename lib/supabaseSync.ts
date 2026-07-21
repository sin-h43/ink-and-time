import { db } from "./db";
// import { supabase } from "./supabaseClient"; // Add this when ready

export async function syncPending() {
  await pushLocalChanges("tasks");
  await pushLocalChanges("doodles");
  await pushLocalChanges("days");
}

async function pushLocalChanges(tableName: "tasks" | "doodles" | "days") {
  const table = db[tableName] as any;
  
  // 1. PUSH UPSERTS (New or Modified)
  const pendingUpserts = await table
    .where("synced").equals(0)
    .filter((record: any) => !record.isDeleted)
    .toArray();

  if (pendingUpserts.length > 0) {
    // const { error } = await supabase.from(tableName).upsert(
    //   pendingUpserts.map(({ id, synced, ...rest }) => rest), // Strip local ID
    //   { onConflict: 'uid' } // or 'date' for the days table
    // );
    // if (!error) {
    //   await table.bulkUpdate(pendingUpserts.map((r: any) => ({ key: r.id || r.date, changes: { synced: true } })));
    // }
  }

  // 2. PUSH DELETES (Soft deleted locally, needs hard delete on remote)
  const pendingDeletes = await table
    .where("synced").equals(0)
    .filter((record: any) => record.isDeleted === true)
    .toArray();

  if (pendingDeletes.length > 0) {
    const uidsToDelete = pendingDeletes.map((r: any) => r.uid); // or r.date for days
    // const { error } = await supabase.from(tableName).delete().in('uid', uidsToDelete);
    
    // if (!error) {
    //   // Once confirmed by server, completely eradicate from local Dexie
    //   await table.bulkDelete(pendingDeletes.map((r: any) => r.id || r.date));
    // }
  }
}

// 3. PULL REMOTE DELTAS (Last-Write-Wins)
// Call this on app load and periodically.
export async function pullRemoteUpdates(lastSyncTimestamp: number) {
  // const { data, error } = await supabase
  //   .from("tasks")
  //   .select("*")
  //   .gt("updatedAt", lastSyncTimestamp);
    
  // if (data) {
  //   for (const remoteRow of data) {
  //      const localRow = await db.tasks.where("uid").equals(remoteRow.uid).first();
  //      if (!localRow || remoteRow.updatedAt > localRow.updatedAt) {
  //         // Remote is newer, overwrite local and mark as synced
  //         await db.tasks.put({ ...localRow, ...remoteRow, synced: true });
  //      }
  //   }
  // }
}