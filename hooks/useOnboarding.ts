import { useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { DEFAULT_CATEGORIES } from '@/constants/categories';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface SaveOnboardingParams {
  bankBalance: string;
  cashBalance: string;
  selectedCategories: Set<string>;
}

export function useOnboarding() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveOnboardingData = useCallback(
    async ({ bankBalance, cashBalance, selectedCategories }: SaveOnboardingParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const now = new Date().toISOString();

        const bankId = generateId();
        await db.runAsync(
          `INSERT INTO accounts (id, name, type, initial_balance, icon, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [bankId, 'Banque', 'bank', parseInt(bankBalance || '0', 10), 'card', now, now]
        );

        const cashId = generateId();
        await db.runAsync(
          `INSERT INTO accounts (id, name, type, initial_balance, icon, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cashId, 'Espèce', 'cash', parseInt(cashBalance || '0', 10), 'cash', now, now]
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
