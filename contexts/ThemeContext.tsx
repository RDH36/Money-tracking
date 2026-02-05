import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { Theme, getThemeById } from '@/constants/colors';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { useSettingsStore, ColorMode } from '@/stores';
import { ReminderFrequency, scheduleReminders } from '@/lib/notifications';

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setTheme: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const db = useSQLiteContext();
  const { themeId, isInitialized, initialize, setThemeId } = useSettingsStore();

  useEffect(() => {
    if (isInitialized) return;

    const loadSettings = async () => {
      try {
        const [balanceResult, themeResult, reminderResult, currencyResult, colorModeResult] = await Promise.all([
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
          db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
            'color_mode',
          ]),
        ]);

        const frequency = (reminderResult?.value as ReminderFrequency) || 'off';
        const currency = currencyResult?.value || DEFAULT_CURRENCY;
        const colorMode = (colorModeResult?.value as ColorMode) || 'system';
        initialize(balanceResult?.value === '1', themeResult?.value || 'turquoise', frequency, currency, colorMode);

        if (frequency !== 'off') {
          scheduleReminders(frequency);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        initialize(false, 'turquoise', 'off', DEFAULT_CURRENCY, 'system');
      }
    };

    loadSettings();
  }, [db, isInitialized, initialize]);

  const setTheme = async (id: string) => {
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
  };

  const theme = getThemeById(themeId);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, isLoading: !isInitialized }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
