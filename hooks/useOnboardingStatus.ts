import { useEffect, useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';

export function useOnboardingStatus() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        ['onboarding_completed']
      );
      setIsCompleted(result?.value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsCompleted(false);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { isLoading, isCompleted };
}
