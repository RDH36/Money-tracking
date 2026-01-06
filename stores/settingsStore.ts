import { create } from 'zustand';
import { Theme, THEMES, DEFAULT_THEME_ID, getThemeById } from '@/constants/colors';
import { ReminderFrequency } from '@/lib/notifications';

interface SettingsState {
  balanceHidden: boolean;
  themeId: string;
  reminderFrequency: ReminderFrequency;
  isLoading: boolean;
  isInitialized: boolean;

  theme: Theme;

  setBalanceHidden: (hidden: boolean) => void;
  toggleBalanceVisibility: () => void;
  setThemeId: (id: string) => void;
  setReminderFrequency: (frequency: ReminderFrequency) => void;
  initialize: (balanceHidden: boolean, themeId: string, reminderFrequency: ReminderFrequency) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  balanceHidden: false,
  themeId: DEFAULT_THEME_ID,
  reminderFrequency: '1h' as ReminderFrequency,
  isLoading: true,
  isInitialized: false,

  get theme() {
    return getThemeById(get().themeId);
  },

  setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),

  toggleBalanceVisibility: () => set((state) => ({ balanceHidden: !state.balanceHidden })),

  setThemeId: (id) => {
    if (THEMES.some((t) => t.id === id)) {
      set({ themeId: id });
    }
  },

  setReminderFrequency: (frequency) => set({ reminderFrequency: frequency }),

  initialize: (balanceHidden, themeId, reminderFrequency) => {
    set({
      balanceHidden,
      themeId: THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID,
      reminderFrequency: reminderFrequency || '1h',
      isLoading: false,
      isInitialized: true,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

export const useBalanceHidden = () => useSettingsStore((state) => state.balanceHidden);
export const useTheme = () => useSettingsStore((state) => getThemeById(state.themeId));
export const useThemeId = () => useSettingsStore((state) => state.themeId);
export const useReminderFrequency = () => useSettingsStore((state) => state.reminderFrequency);
