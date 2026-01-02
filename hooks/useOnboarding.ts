import { useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { DEFAULT_CATEGORIES, DefaultCategory } from '@/constants/categories';

interface SaveOnboardingParams {
  balance: string;
  selectedCategories: Set<string>;
}

export function useOnboarding() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveOnboardingData = useCallback(
    async ({ balance, selectedCategories }: SaveOnboardingParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const now = new Date().toISOString();

        await db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          ['initial_balance', balance || '0', now]
        );

        await db.runAsync(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
          ['onboarding_completed', 'true', now]
        );

        for (const category of DEFAULT_CATEGORIES) {
          if (selectedCategories.has(category.id)) {
            await db.runAsync(
              `INSERT OR IGNORE INTO categories (id, name, icon, color, is_default, created_at, sync_status)
               VALUES (?, ?, ?, ?, 1, ?, 'pending')`,
              [category.id, category.name, category.icon, category.color, now]
            );
          }
        }

        return true;
      } catch (err) {
        console.error('Error saving onboarding data:', err);
        setError('Erreur lors de la sauvegarde');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [db]
  );

  return {
    saveOnboardingData,
    isLoading,
    error,
    categories: DEFAULT_CATEGORIES,
  };
}
