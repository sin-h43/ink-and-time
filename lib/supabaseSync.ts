import { createClient } from '@supabase/supabase-js';
import { db } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

const getLST = () => parseInt(localStorage.getItem('dome_last_sync') || '0', 10);
const setLST = (time: number) => localStorage.setItem('dome_last_sync', time.toString());

export async function pushLocalChangesToSupabase() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  const lastSync = getLST();
  const now = Date.now();

  try {
    const pendingTasks = await db.tasks.where('updated_at').above(lastSync).toArray();
    const pendingDoodles = await db.doodles.where('updated_at').above(lastSync).toArray();
    const pendingDays = await db.days.where('updated_at').above(lastSync).toArray();

    if (!pendingTasks.length && !pendingDoodles.length && !pendingDays.length) return;

    if (pendingTasks.length > 0) {
      // local_id / updated_at / deleted_at already match the remote column names
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