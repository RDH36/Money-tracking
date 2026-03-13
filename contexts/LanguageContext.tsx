import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSQLiteContext } from '@/lib/database';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { initI18n, changeLanguage, LanguageCode, DEFAULT_LANGUAGE, getDeviceLanguage } from '@/lib/i18n';

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const db = useSQLiteContext();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    const initLanguage = async () => {
      try {
        const result = await db.getFirstAsync<{ value: string }>(
          'SELECT value FROM settings WHERE key = ?',
          ['language']
        );

        const savedLanguage = result?.value as LanguageCode | undefined;
        const languageToUse = savedLanguage || getDeviceLanguage();

        await initI18n(languageToUse);
        setLanguageState(languageToUse);

        if (!savedLanguage) {
          const now = new Date().toISOString();
          await db.runAsync(
            `INSERT INTO settings (key, value, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
            ['language', languageToUse, now, languageToUse, now]
          );
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        await initI18n(DEFAULT_LANGUAGE);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initLanguage();
  }, [db, isInitialized]);

  const setLanguage = async (code: LanguageCode) => {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        ['language', code, now, code, now]
      );
      await changeLanguage(code);
      setLanguageState(code);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
