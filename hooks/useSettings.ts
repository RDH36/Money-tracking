import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore, ColorMode } from '@/stores';
import { ReminderFrequency, scheduleReminders } from '@/lib/notifications';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { checkInternetConnection } from '@/lib/network';
import { fetchExchangeRate } from '@/lib/exchangeRate';

export function useSettings() {
  const db = useSQLiteContext();
  const {
    balanceHidden,
    themeId,
    colorMode,
    reminderFrequency,
    currencyCode,
    isInitialized,
    initialize,
    setBalanceHidden,
    setThemeId,
    setColorMode: setStoreColorMode,
    setReminderFrequency: setStoreReminderFrequency,
    setCurrencyCode: setStoreCurrencyCode,
  } = useSettingsStore();

  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult, reminderResult, currencyResult, colorModeResult] = await Promise.all([
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['balance_hidden']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['theme_id']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['reminder_frequency']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['currency']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['color_mode']),
        ]);

        const frequency = (reminderResult?.value as ReminderFrequency) || '1h';
        const currency = currencyResult?.value || DEFAULT_CURRENCY;
        const mode = (colorModeResult?.value as ColorMode) || 'system';
        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise', frequency, currency, mode);
        scheduleReminders(frequency);
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise', '1h', DEFAULT_CURRENCY, 'system');
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

  const setColorMode = useCallback(
    async (mode: ColorMode) => {
      try {
        const now = new Date().toISOString();

        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          ['color_mode', mode, now, mode, now]
        );

        setStoreColorMode(mode);
      } catch (error) {
        console.error('Error saving color mode:', error);
      }
    },
    [db, setStoreColorMode]
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

  const changeCurrencyWithConversion = useCallback(
    async (
      newCode: string,
      convertBalances: (rate: number) => Promise<boolean>
    ): Promise<{ success: boolean; error?: string }> => {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        return { success: false, error: 'Pas de connexion internet' };
      }

      try {
        const rate = await fetchExchangeRate(currencyCode, newCode);
        const converted = await convertBalances(rate);
        if (!converted) {
          return { success: false, error: 'Erreur lors de la conversion des soldes' };
        }

        await setCurrency(newCode);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return { success: false, error: message };
      }
    },
    [currencyCode, setCurrency]
  );

  return {
    balanceHidden,
    themeId,
    colorMode,
    reminderFrequency,
    currencyCode,
    toggleBalanceVisibility,
    setTheme,
    setColorMode,
    setReminderFrequency,
    setCurrency,
    changeCurrencyWithConversion,
    isLoading: !isInitialized,
  };
}
