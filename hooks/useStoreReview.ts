import { useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';
import * as StoreReview from 'expo-store-review';

const REVIEW_THRESHOLD = 20;
const SETTINGS_KEY = 'review_transaction_count';

export function useStoreReview() {
  const db = useSQLiteContext();

  const incrementAndCheck = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [SETTINGS_KEY]
      );
      const currentCount = result ? parseInt(result.value, 10) : 0;
      const newCount = currentCount + 1;

      if (newCount >= REVIEW_THRESHOLD) {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          await StoreReview.requestReview();
        }
        await saveSetting(db, SETTINGS_KEY, '0');
      } else {
        await saveSetting(db, SETTINGS_KEY, String(newCount));
      }
    } catch (error) {
      console.error('Error in store review check:', error);
    }
  }, [db]);

  return { incrementAndCheck };
}

async function saveSetting(db: ReturnType<typeof useSQLiteContext>, key: string, value: string) {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
    [key, value, now, value, now]
  );
}
