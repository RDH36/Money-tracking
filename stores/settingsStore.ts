import { create } from 'zustand';
import { Theme, THEMES, DEFAULT_THEME_ID, getThemeById } from '@/constants/colors';

interface SettingsState {
  // State
  balanceHidden: boolean;
  themeId: string;
  isLoading: boolean;
  isInitialized: boolean;

  // Computed
  theme: Theme;

  // Actions
  setBalanceHidden: (hidden: boolean) => void;
  toggleBalanceVisibility: () => void;
  setThemeId: (id: string) => void;
  initialize: (balanceHidden: boolean, themeId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state
  balanceHidden: false,
  themeId: DEFAULT_THEME_ID,
  isLoading: true,
  isInitialized: false,

  // Computed theme
  get theme() {
    return getThemeById(get().themeId);
  },

  // Actions
  setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),

  toggleBalanceVisibility: () => set((state) => ({ balanceHidden: !state.balanceHidden })),

  setThemeId: (id) => {
    if (THEMES.some((t) => t.id === id)) {
      set({ themeId: id });
    }
  },

  initialize: (balanceHidden, themeId) => {
    set({
      balanceHidden,
      themeId: THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID,
      isLoading: false,
      isInitialized: true,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

// Selector hooks for optimized re-renders
export const useBalanceHidden = () => useSettingsStore((state) => state.balanceHidden);
export const useTheme = () => useSettingsStore((state) => getThemeById(state.themeId));
export const useThemeId = () => useSettingsStore((state) => state.themeId);
