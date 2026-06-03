import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';

const DISMISS_KEY = 'app_lock_banner_dismissed';

/**
 * Tracks whether the "enable app lock" promo banner was dismissed.
 * Persisted in the settings table so it stays hidden across launches.
 */
export function useAppLockBanner() {
  const db = useSQLiteContext();
  const [dismissed, setDismissed] = useState(true); // hide until we know

  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = ?',
          [DISMISS_KEY]
        );
        setDismissed(row?.value === '1');
      } catch {
        setDismissed(false);
      }
    })();
  }, [db]);

  const dismiss = useCallback(async () => {
    setDismissed(true);
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        [DISMISS_KEY, '1', now]
      );
    } catch (err) {
      console.error('Error dismissing app lock banner:', err);
    }
  }, [db]);

  return { dismissed, dismiss };
}
