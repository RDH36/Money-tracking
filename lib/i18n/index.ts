import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import fr from './translations/fr.json';
import en from './translations/en.json';

export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'fr';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
};

export function getDeviceLanguage(): LanguageCode {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'fr';
  return LANGUAGES.some((l) => l.code === deviceLocale) ? (deviceLocale as LanguageCode) : DEFAULT_LANGUAGE;
}

export async function initI18n(savedLanguage?: string | null) {
  const language = savedLanguage || getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
}

export async function changeLanguage(code: LanguageCode) {
  await i18n.changeLanguage(code);
}

export default i18n;
