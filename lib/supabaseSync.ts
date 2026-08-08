import { supabase } from './supabaseClient';
import { db } from './db';

const getLST = () => parseInt(localStorage.getItem('dome_last_sync') || '0', 10);
const setLST = (time: number) => localStorage.setItem('dome_last_sync', time.toString());

export async function pushLocalChangesToSupabase() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  // Bail early if there's no authenticated session — RLS rejects everything
  // anyway, and this avoids masking the real cause behind a generic PG error.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('[Sync] Skipped — no authenticated session.');
    return;
  }

  const lastSync = getLST();
  const now = Date.now();

  try {
    const pendingTasks = await db.tasks.where('updated_at').above(lastSync).toArray();
    const pendingDoodles = await db.doodles.where('updated_at').above(lastSync).toArray();
    const pendingDays = await db.days.where('updated_at').above(lastSync).toArray();

    if (!pendingTasks.length && !pendingDoodles.length && !pendingDays.length) return;

    if (pendingTasks.length > 0) {
      const { error } = await supabase.from('tasks').upsert(
        pendingTasks.map(({ id, ...rest }) => rest),
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    if (pendingDoodles.length > 0) {
      const { error } = await supabase.from('doodles').upsert(
        pendingDoodles.map(({ id, iconId, ...rest }) => ({ ...rest, icon_id: iconId })),
        { onConflict: 'local_id' }
      );
      if (error) throw error;
    }

    if (pendingDays.length > 0) {
      const { error } = await supabase.from('days').upsert(
        pendingDays.map(({ id, shadeId, ...rest }) => ({ ...rest, shade_id: shadeId })),
        { onConflict: 'date' }
      );
      if (error) throw error;
    }

    setLST(now);
    console.log(`[Sync] Successfully pushed ${pendingTasks.length + pendingDoodles.length + pendingDays.length} records.`);
  } catch (error) {
    console.error('[Sync] Push failed:', error);
  }
}