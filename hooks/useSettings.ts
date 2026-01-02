import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores';

export function useSettings() {
  const db = useSQLiteContext();
  const { balanceHidden, themeId, isInitialized, initialize, setBalanceHidden, setThemeId } =
    useSettingsStore();

  // Load settings from SQLite on mount
  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult] = await Promise.all([
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'balance_hidden',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'theme_id',
          ]),
        ]);

        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise');
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise');
      }
    };

    loadSettings();
  }, [db, isInitialized, initialize]);

  const toggleBalanceVisibility = useCallback(async () => {
    try {
      const newValue = !balanceHidden;
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['balance_hidden', newValue ? '1' : '0', now, newValue ? '1' : '0', now]
      );

      setBalanceHidden(newValue);
    } catch (error) {
      console.error('Error toggling balance visibility:', error);
    }
  }, [db, balanceHidden, setBalanceHidden]);

  const setTheme = useCallback(
    async (id: string) => {
      try {
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          ['theme_id', id, now, id, now]
        );

        setThemeId(id);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },
    [db, setThemeId]
  );

  return {
    balanceHidden,
    themeId,
    toggleBalanceVisibility,
    setTheme,
    isLoading: !isInitialized,
  };
}
