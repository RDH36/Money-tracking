import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore, ColorMode } from '@/stores';
import { ReminderFrequency, scheduleReminders } from '@/lib/notifications';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { checkInternetConnection } from '@/lib/network';
import { fetchExchangeRate } from '@/lib/exchangeRate';
import { isBiometricAvailable, clearPin } from '@/lib/appLock';

export function useSettings() {
  const db = useSQLiteContext();
  const {
    balanceHidden,
    appLockEnabled,
    appLockBiometric,
    themeId,
    colorMode,
    reminderFrequency,
    currencyCode,
    tipsEnabled,
    isInitialized,
    initialize,
    setBalanceHidden,
    setAppLockEnabled: setStoreAppLockEnabled,
    setAppLockBiometric: setStoreAppLockBiometric,
    setThemeId,
    setColorMode: setStoreColorMode,
    setReminderFrequency: setStoreReminderFrequency,
    setCurrencyCode: setStoreCurrencyCode,
    setTipsEnabled: setStoreTipsEnabled,
  } = useSettingsStore();

  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult, reminderResult, currencyResult, colorModeResult, tipsResult, appLockResult, appLockBiometricResult] = await Promise.all([
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['balance_hidden']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['theme_id']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['reminder_frequency']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['currency']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['color_mode']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['tips_enabled']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['app_lock_enabled']),
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['app_lock_biometric']),
        ]);

        const frequency = (reminderResult?.value as ReminderFrequency) || '1h';
        const currency = currencyResult?.value || DEFAULT_CURRENCY;
        const mode = (colorModeResult?.value as ColorMode) || 'system';
        const tips = tipsResult?.value !== '0';
        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise', frequency, currency, mode, tips, appLockResult?.value === '1', appLockBiometricResult?.value === '1');
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise', '1h', DEFAULT_CURRENCY, 'system', true, false, false);
      }
    };

    loadSettings();
  }, [db, isInitialized, initialize]);

  const persistSetting = useCallback(
    async (key: string, value: string) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        [key, value, now, value, now]
      );
    },
    [db]
  );

  const toggleBalanceVisibility = useCallback(async () => {
    try {
      const newValue = !balanceHidden;
      await persistSetting('balance_hidden', newValue ? '1' : '0');
      setBalanceHidden(newValue);
    } catch (error) {
      console.error('Error toggling balance visibility:', error);
    }
  }, [persistSetting, balanceHidden, setBalanceHidden]);

  // Enable/disable the app lock. The PIN itself is set via lib/appLock before
  // enabling; disabling clears the stored PIN and the biometric option.
  const setAppLockEnabled = useCallback(
    async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
      try {
        await persistSetting('app_lock_enabled', enabled ? '1' : '0');
        setStoreAppLockEnabled(enabled);
        if (!enabled) {
          await persistSetting('app_lock_biometric', '0');
          setStoreAppLockBiometric(false);
          await clearPin();
        }
        return { success: true };
      } catch (error) {
        console.error('Error saving app lock setting:', error);
        return { success: false, error: 'errors.saveFailed' };
      }
    },
    [persistSetting, setStoreAppLockEnabled, setStoreAppLockBiometric]
  );

  // Toggle biometric unlock as a faster alternative to the PIN. Requires an
  // enrolled biometric on the device.
  const setAppLockBiometric = useCallback(
    async (enabled: boolean): Promise<{ success: boolean; error?: string }> => {
      if (enabled) {
        const available = await isBiometricAvailable();
        if (!available) {
          return { success: false, error: 'privacyV2.faceIdUnavailable' };
        }
      }
      try {
        await persistSetting('app_lock_biometric', enabled ? '1' : '0');
        setStoreAppLockBiometric(enabled);
        return { success: true };
      } catch (error) {
        console.error('Error saving biometric setting:', error);
        return { success: false, error: 'errors.saveFailed' };
      }
    },
    [persistSetting, setStoreAppLockBiometric]
  );

  const setTheme = useCallback(
    async (id: string) => {
      try {
        await persistSetting('theme_id', id);
        setThemeId(id);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    },
    [persistSetting, setThemeId]
  );

  const setColorMode = useCallback(
    async (mode: ColorMode) => {
      try {
        await persistSetting('color_mode', mode);
        setStoreColorMode(mode);
      } catch (error) {
        console.error('Error saving color mode:', error);
      }
    },
    [persistSetting, setStoreColorMode]
  );

  const setReminderFrequency = useCallback(
    async (frequency: ReminderFrequency) => {
      try {
        await persistSetting('reminder_frequency', frequency);
        setStoreReminderFrequency(frequency);
        await scheduleReminders(frequency);
      } catch (error) {
        console.error('Error saving reminder frequency:', error);
      }
    },
    [persistSetting, setStoreReminderFrequency]
  );

  const setCurrency = useCallback(
    async (code: string) => {
      try {
        await persistSetting('currency', code);
        setStoreCurrencyCode(code);
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    },
    [persistSetting, setStoreCurrencyCode]
  );

  const changeCurrencyWithConversion = useCallback(
    async (
      newCode: string,
      convertBalances: (rate: number) => Promise<boolean>
    ): Promise<{ success: boolean; error?: string }> => {
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        return { success: false, error: 'errors.noInternet' };
      }

      try {
        const rate = await fetchExchangeRate(currencyCode, newCode);
        const converted = await convertBalances(rate);
        if (!converted) {
          return { success: false, error: 'errors.conversionFailed' };
        }

        await setCurrency(newCode);
        return { success: true };
      } catch (error) {
        return { success: false, error: 'errors.unknown' };
      }
    },
    [currencyCode, setCurrency]
  );

  const setTipsEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        await persistSetting('tips_enabled', enabled ? '1' : '0');
        setStoreTipsEnabled(enabled);
      } catch (error) {
        console.error('Error saving tips enabled:', error);
      }
    },
    [persistSetting, setStoreTipsEnabled]
  );

  return {
    balanceHidden,
    appLockEnabled,
    appLockBiometric,
    themeId,
    colorMode,
    reminderFrequency,
    currencyCode,
    tipsEnabled,
    toggleBalanceVisibility,
    setAppLockEnabled,
    setAppLockBiometric,
    setTheme,
    setColorMode,
    setReminderFrequency,
    setCurrency,
    changeCurrencyWithConversion,
    setTipsEnabled,
    isLoading: !isInitialized,
  };
}
