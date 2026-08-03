import { useEffect } from 'react';
import { pushLocalChangesToSupabase } from './supabaseSync';

export function useBackgroundSync() {
  useEffect(() => {
    // Fire immediately on mount
    pushLocalChangesToSupabase();

    // Fire when device comes back online
    window.addEventListener('online', pushLocalChangesToSupabase);
    
    // Fire when user returns to the app tab/window
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pushLocalChangesToSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', pushLocalChangesToSupabase);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}