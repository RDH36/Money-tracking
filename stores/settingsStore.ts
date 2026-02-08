import { create } from 'zustand';
import { Theme, THEMES, DEFAULT_THEME_ID, getThemeById } from '@/constants/colors';
import { ReminderFrequency } from '@/lib/notifications';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyByCode, Currency } from '@/constants/currencies';

export type ColorMode = 'light' | 'dark' | 'system';

interface SettingsState {
  balanceHidden: boolean;
  themeId: string;
  colorMode: ColorMode;
  reminderFrequency: ReminderFrequency;
  currencyCode: string;
  tipsEnabled: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  theme: Theme;
  currency: Currency;

  setBalanceHidden: (hidden: boolean) => void;
  toggleBalanceVisibility: () => void;
  setThemeId: (id: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setReminderFrequency: (frequency: ReminderFrequency) => void;
  setCurrencyCode: (code: string) => void;
  setTipsEnabled: (enabled: boolean) => void;
  initialize: (balanceHidden: boolean, themeId: string, reminderFrequency: ReminderFrequency, currencyCode: string, colorMode: ColorMode, tipsEnabled: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  balanceHidden: false,
  themeId: DEFAULT_THEME_ID,
  colorMode: 'system' as ColorMode,
  reminderFrequency: '1h' as ReminderFrequency,
  currencyCode: DEFAULT_CURRENCY,
  tipsEnabled: true,
  isLoading: true,
  isInitialized: false,

  get theme() {
    return getThemeById(get().themeId);
  },

  get currency() {
    return getCurrencyByCode(get().currencyCode);
  },

  setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),

  toggleBalanceVisibility: () => set((state) => ({ balanceHidden: !state.balanceHidden })),

  setThemeId: (id) => {
    if (THEMES.some((t) => t.id === id)) {
      set({ themeId: id });
    }
  },

  setColorMode: (mode) => {
    if (['light', 'dark', 'system'].includes(mode)) {
      set({ colorMode: mode });
    }
  },

  setReminderFrequency: (frequency) => set({ reminderFrequency: frequency }),

  setCurrencyCode: (code) => {
    if (CURRENCIES.some((c) => c.code === code)) {
      set({ currencyCode: code });
    }
  },

  setTipsEnabled: (enabled) => set({ tipsEnabled: enabled }),

  initialize: (balanceHidden, themeId, reminderFrequency, currencyCode, colorMode, tipsEnabled) => {
    set({
      balanceHidden,
      themeId: THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID,
      colorMode: ['light', 'dark', 'system'].includes(colorMode) ? colorMode : 'system',
      reminderFrequency: reminderFrequency || '1h',
      currencyCode: CURRENCIES.some((c) => c.code === currencyCode) ? currencyCode : DEFAULT_CURRENCY,
      tipsEnabled: tipsEnabled ?? true,
      isLoading: false,
      isInitialized: true,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

export const useBalanceHidden = () => useSettingsStore((state) => state.balanceHidden);
export const useTheme = () => useSettingsStore((state) => getThemeById(state.themeId));
export const useThemeId = () => useSettingsStore((state) => state.themeId);
export const useColorMode = () => useSettingsStore((state) => state.colorMode);
export const useReminderFrequency = () => useSettingsStore((state) => state.reminderFrequency);
export const useCurrencyCode = () => useSettingsStore((state) => state.currencyCode);
export const useCurrency = () => useSettingsStore((state) => getCurrencyByCode(state.currencyCode));
export const useTipsEnabled = () => useSettingsStore((state) => state.tipsEnabled);
