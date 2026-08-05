import { supabase } from './Supabaseclient';
import { db } from './db';

// Track the last sync time in localStorage to avoid redundant payloads
const getLST = () => parseInt(localStorage.getItem('dome_last_sync') || '0', 10);
const setLST = (time: number) => localStorage.setItem('dome_last_sync', time.toString());

export async function pushLocalChangesToSupabase() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  // Only push once someone's actually signed in — otherwise every row would
  // violate the `user_id = auth.uid()` RLS policies in db.md.
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const lastSync = getLST();
  const now = Date.now();

  try {
    // 1. Gather all local changes since last sync
    const pendingTasks = await db.tasks.where('updated_at').above(lastSync).toArray();
    const pendingDoodles = await db.doodles.where('updated_at').above(lastSync).toArray();
    const pendingDays = await db.days.where('updated_at').above(lastSync).toArray();

    if (!pendingTasks.length && !pendingDoodles.length && !pendingDays.length) return;

    // 2. Push Tasks
    if (pendingTasks.length > 0) {
      const { error } = await supabase.from('tasks').upsert(
        pendingTasks.map(({ id, ...rest }) => rest), // Strip local auto-increment ID
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    // 3. Push Doodles
    if (pendingDoodles.length > 0) {
      const { error } = await supabase.from('doodles').upsert(
        pendingDoodles.map(({ id, ...rest }) => rest),
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    // 4. Push Days
    if (pendingDays.length > 0) {
      const { error } = await supabase.from('days').upsert(
        pendingDays.map(({ id, ...rest }) => rest),
        { onConflict: 'date' }
      );
      if (error) throw error;
    }

    // 5. Update timestamp on success
    setLST(now);
    console.log(`[Sync] Successfully pushed ${pendingTasks.length + pendingDoodles.length + pendingDays.length} records.`);
  } catch (error) {
    console.error('[Sync] Push failed:', error);
  }
}