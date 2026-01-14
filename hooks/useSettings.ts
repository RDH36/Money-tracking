import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores';
import { ReminderFrequency, scheduleReminders } from '@/lib/notifications';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

export function useSettings() {
  const db = useSQLiteContext();
  const {
    balanceHidden,
    themeId,
    reminderFrequency,
    currencyCode,
    isInitialized,
    initialize,
    setBalanceHidden,
    setThemeId,
    setReminderFrequency: setStoreReminderFrequency,
    setCurrencyCode: setStoreCurrencyCode,
  } = useSettingsStore();

  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult, reminderResult, currencyResult] = await Promise.all([
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'balance_hidden',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'theme_id',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'reminder_frequency',
          ]),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'currency',
          ]),
        ]);

        const frequency = (reminderResult?.value as ReminderFrequency) || '1h';
        const currency = currencyResult?.value || DEFAULT_CURRENCY;
        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise', frequency, currency);
        scheduleReminders(frequency);
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise', '1h', DEFAULT_CURRENCY);
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

  const setCurrency = useCallback(
    async (code: string) => {
      try {
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          ['currency', code, now, code, now]
        );

        setStoreCurrencyCode(code);
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    },
    [db, setStoreCurrencyCode]
  );

  return {
    balanceHidden,
    themeId,
    reminderFrequency,
    currencyCode,
    toggleBalanceVisibility,
    setTheme,
    setReminderFrequency,
    setCurrency,
    isLoading: !isInitialized,
  };
}
