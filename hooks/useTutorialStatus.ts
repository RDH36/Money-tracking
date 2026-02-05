import { useEffect, useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';

export function useTutorialStatus() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['tutorial_completed']
      );
      setIsCompleted(result?.value === 'true');
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const reset = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['tutorial_completed', 'false', now, 'false', now]
      );
      setIsCompleted(false);
    } catch (error) {
      console.error('Error resetting tutorial status:', error);
    }
  }, [db]);

  const complete = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['tutorial_completed', 'true', now, 'true', now]
      );
      setIsCompleted(true);
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  }, [db]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { isLoading, isCompleted, reset, complete };
}
