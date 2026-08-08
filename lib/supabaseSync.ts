import { supabase } from './supabaseClient';
import type { DoMEDatabase } from './db';

const lastSyncKey = (userId: string) => `dome_last_sync_${userId}`;
const getLST = (userId: string) => parseInt(localStorage.getItem(lastSyncKey(userId)) || '0', 10);
const setLST = (userId: string, time: number) => localStorage.setItem(lastSyncKey(userId), time.toString());

export async function pushLocalChangesToSupabase(db: DoMEDatabase) {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('[Sync] Skipped — no authenticated session.');
    return;
  }
  const userId = session.user.id;

  const lastSync = getLST(userId);
  const now = Date.now();

  try {
    const pendingTasks = await db.tasks.where('updated_at').above(lastSync).toArray();
    const pendingDoodles = await db.doodles.where('updated_at').above(lastSync).toArray();
    const pendingDays = await db.days.where('updated_at').above(lastSync).toArray();

    if (!pendingTasks.length && !pendingDoodles.length && !pendingDays.length) return;

    if (pendingTasks.length > 0) {
      const { error } = await supabase.from('tasks').upsert(
        // Explicitly stamping user_id here (rather than relying only on the
        // column default) guarantees correct attribution regardless of any
        // default-evaluation edge cases, and matches the RLS check exactly.
        pendingTasks.map(({ id, ...rest }) => ({ ...rest, user_id: userId })),
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    if (pendingDoodles.length > 0) {
      const { error } = await supabase.from('doodles').upsert(
        pendingDoodles.map(({ id, iconId, ...rest }) => ({ ...rest, icon_id: iconId, user_id: userId })),
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    if (pendingDays.length > 0) {
      const { error } = await supabase.from('days').upsert(
        pendingDays.map(({ id, shadeId, ...rest }) => ({ ...rest, shade_id: shadeId, user_id: userId })),
        // Matches the fixed unique constraint (date, user_id) — see the SQL
        // migration below. With the old global `unique(date)` constraint,
        // this MUST be updated too or every upsert will keep clobbering
        // whichever user last wrote to that date.
        { onConflict: 'date,user_id' }
      );
      if (error) throw error;
    }

    setLST(userId, now);
    console.log(`[Sync] Successfully pushed ${pendingTasks.length + pendingDoodles.length + pendingDays.length} records.`);
  } catch (error) {
    console.error('[Sync] Push failed:', error);
  }
}