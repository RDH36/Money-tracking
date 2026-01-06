import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores';
import { ReminderFrequency, scheduleReminders } from '@/lib/notifications';

export function useSettings() {
  const db = useSQLiteContext();
  const {
    balanceHidden,
    themeId,
    reminderFrequency,
    isInitialized,
    initialize,
    setBalanceHidden,
    setThemeId,
    setReminderFrequency: setStoreReminderFrequency,
  } = useSettingsStore();

  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult, reminderResult] = await Promise.all([
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'balance_hidden',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'theme_id',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'reminder_frequency',
          ]),
        ]);

        const frequency = (reminderResult?.value as ReminderFrequency) || '1h';
        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise', frequency);
        scheduleReminders(frequency);
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise', '1h');
        scheduleReminders('1h');
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

  const setReminderFrequency = useCallback(
    async (frequency: ReminderFrequency) => {
      try {
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          ['reminder_frequency', frequency, now, frequency, now]
        );

        setStoreReminderFrequency(frequency);
        await scheduleReminders(frequency);
      } catch (error) {
        console.error('Error saving reminder frequency:', error);
      }
    },
    [db, setStoreReminderFrequency]
  );

  return {
    balanceHidden,
    themeId,
    reminderFrequency,
    toggleBalanceVisibility,
    setTheme,
    setReminderFrequency,
    isLoading: !isInitialized,
  };
}
