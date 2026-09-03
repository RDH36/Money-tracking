import { create } from 'zustand';
import { Theme, THEMES, DEFAULT_THEME_ID, getThemeById } from '@/constants/colors';
import { ReminderFrequency } from '@/lib/notifications';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyByCode, Currency } from '@/constants/currencies';
import type { CycleMode, CycleSettings } from '@/lib/analysis/types';

export type ColorMode = 'light' | 'dark' | 'system';
export type ExpectedIncomeSource = 'detected' | 'manual';

const CYCLE_MODES: CycleMode[] = ['calendar', 'payday', 'irregular'];

/** Valeurs de cycle (Phase 7) hydratées au boot, déjà parsées. */
export interface CycleInit {
  cycleMode: CycleMode;
  cyclePayDay: number | null;
  expectedIncome: number | null;
  expectedIncomeSource: ExpectedIncomeSource | null;
  cycleConfirmedAt: string | null;
}

export const DEFAULT_CYCLE_INIT: CycleInit = {
  cycleMode: 'calendar',
  cyclePayDay: null,
  expectedIncome: null,
  expectedIncomeSource: null,
  cycleConfirmedAt: null,
};

/** Lignes brutes de la table `settings` (clé → valeur, ou undefined si absente). */
export interface CycleRawRows {
  cycle_mode?: string | null;
  cycle_pay_day?: string | null;
  expected_income?: string | null;
  expected_income_source?: string | null;
  cycle_confirmed_at?: string | null;
}

/** Entier strict dans [min, max], sinon null (chaîne vide, NaN, hors bornes). */
function parseIntInRange(raw: string | null | undefined, min: number, max: number): number | null {
  if (!raw || !/^-?\d+$/.test(raw.trim())) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n >= min && n <= max ? n : null;
}

/** Parsing sûr des 5 clés `settings` du cycle. Toute valeur invalide → défaut. */
export function parseCycleInit(rows: CycleRawRows): CycleInit {
  const mode = CYCLE_MODES.includes(rows.cycle_mode as CycleMode)
    ? (rows.cycle_mode as CycleMode)
    : 'calendar';
  const source = rows.expected_income_source;
  return {
    cycleMode: mode,
    cyclePayDay: parseIntInRange(rows.cycle_pay_day, 1, 31),
    expectedIncome: parseIntInRange(rows.expected_income, 0, Number.MAX_SAFE_INTEGER),
    expectedIncomeSource: source === 'detected' || source === 'manual' ? source : null,
    cycleConfirmedAt: rows.cycle_confirmed_at ? rows.cycle_confirmed_at : null,
  };
}

interface SettingsState extends CycleInit {
  balanceHidden: boolean;
  appLockEnabled: boolean;
  appLockBiometric: boolean;
  themeId: string;
  colorMode: ColorMode;
  reminderFrequency: ReminderFrequency;
  currencyCode: string;
  tipsEnabled: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  theme: Theme;
  currency: Currency;
  /**
   * Réglages de cycle dérivés (mode + jour de paye). Nouvel objet à chaque
   * lecture : à consommer via `getState()` ou un `useMemo` sur `cycleMode` /
   * `cyclePayDay`, pas comme sélecteur zustand direct.
   */
  cycleSettings: CycleSettings;

  setBalanceHidden: (hidden: boolean) => void;
  toggleBalanceVisibility: () => void;
  setAppLockEnabled: (enabled: boolean) => void;
  setAppLockBiometric: (enabled: boolean) => void;
  setThemeId: (id: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setReminderFrequency: (frequency: ReminderFrequency) => void;
  setCurrencyCode: (code: string) => void;
  setTipsEnabled: (enabled: boolean) => void;
  setCycleMode: (mode: CycleMode) => void;
  setCyclePayDay: (day: number | null) => void;
  setExpectedIncome: (amount: number | null) => void;
  setExpectedIncomeSource: (source: ExpectedIncomeSource | null) => void;
  setCycleConfirmedAt: (iso: string | null) => void;
  initialize: (
    balanceHidden: boolean,
    themeId: string,
    reminderFrequency: ReminderFrequency,
    currencyCode: string,
    colorMode: ColorMode,
    tipsEnabled: boolean,
    appLockEnabled: boolean,
    appLockBiometric: boolean,
    cycle?: CycleInit
  ) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  balanceHidden: false,
  appLockEnabled: false,
  appLockBiometric: false,
  themeId: DEFAULT_THEME_ID,
  colorMode: 'system' as ColorMode,
  reminderFrequency: '1h' as ReminderFrequency,
  currencyCode: DEFAULT_CURRENCY,
  tipsEnabled: true,
  ...DEFAULT_CYCLE_INIT,
  isLoading: true,
  isInitialized: false,

  get theme() {
    return getThemeById(get().themeId);
  },

  get currency() {
    return getCurrencyByCode(get().currencyCode);
  },

  get cycleSettings(): CycleSettings {
    const { cycleMode, cyclePayDay } = get();
    return { mode: cycleMode, payDay: cycleMode === 'payday' ? cyclePayDay : null };
  },

  setBalanceHidden: (hidden) => set({ balanceHidden: hidden }),

  toggleBalanceVisibility: () => set((state) => ({ balanceHidden: !state.balanceHidden })),

  setAppLockEnabled: (enabled) => set({ appLockEnabled: enabled }),

  setAppLockBiometric: (enabled) => set({ appLockBiometric: enabled }),

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

  setCycleMode: (mode) => {
    if (CYCLE_MODES.includes(mode)) set({ cycleMode: mode });
  },

  setCyclePayDay: (day) =>
    set({ cyclePayDay: day !== null && day >= 1 && day <= 31 ? Math.trunc(day) : null }),

  setExpectedIncome: (amount) =>
    set({ expectedIncome: amount !== null && amount >= 0 ? Math.trunc(amount) : null }),

  setExpectedIncomeSource: (source) => set({ expectedIncomeSource: source }),

  setCycleConfirmedAt: (iso) => set({ cycleConfirmedAt: iso }),

  initialize: (balanceHidden, themeId, reminderFrequency, currencyCode, colorMode, tipsEnabled, appLockEnabled, appLockBiometric, cycle = DEFAULT_CYCLE_INIT) => {
    set({
      balanceHidden,
      appLockEnabled,
      appLockBiometric,
      themeId: THEMES.some((t) => t.id === themeId) ? themeId : DEFAULT_THEME_ID,
      colorMode: ['light', 'dark', 'system'].includes(colorMode) ? colorMode : 'system',
      reminderFrequency: reminderFrequency || '1h',
      currencyCode: CURRENCIES.some((c) => c.code === currencyCode) ? currencyCode : DEFAULT_CURRENCY,
      tipsEnabled: tipsEnabled ?? true,
      ...cycle,
      isLoading: false,
      isInitialized: true,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));

export const useBalanceHidden = () => useSettingsStore((state) => state.balanceHidden);
export const useAppLockEnabled = () => useSettingsStore((state) => state.appLockEnabled);
export const useAppLockBiometric = () => useSettingsStore((state) => state.appLockBiometric);
export const useTheme = () => useSettingsStore((state) => getThemeById(state.themeId));
export const useThemeId = () => useSettingsStore((state) => state.themeId);
export const useColorMode = () => useSettingsStore((state) => state.colorMode);
export const useReminderFrequency = () => useSettingsStore((state) => state.reminderFrequency);
export const useCurrencyCode = () => useSettingsStore((state) => state.currencyCode);
export const useCurrency = () => useSettingsStore((state) => getCurrencyByCode(state.currencyCode));
export const useTipsEnabled = () => useSettingsStore((state) => state.tipsEnabled);
export const useExpectedIncome = () => useSettingsStore((state) => state.expectedIncome);
