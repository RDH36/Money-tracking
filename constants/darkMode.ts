// Dark mode aware color constants
export const DARK_COLORS = {
  background: '#121212',
  cardBg: '#1C1C1E',
  cardBorder: '#38383A',
  textMuted: '#C7C7CC',
  chipBg: '#2C2C2E',
  inputBg: '#1C1C1E',
  switchOff: '#39393D',
  switchThumb: '#FFFFFF',
};

export const LIGHT_COLORS = {
  background: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E5E5',
  textMuted: '#666666',
  chipBg: '#F2F2F7',
  inputBg: '#FFFFFF',
  switchOff: '#E5E5EA',
  switchThumb: '#FFFFFF',
};

// Semantic colors (same in both modes)
export const SEMANTIC_COLORS = {
  error: '#DC2626',
  errorLight: '#FEE2E2',
  errorLightDark: '#450A0A',
  success: '#22C55E',
  successLight: '#F0FDF4',
  successLightDark: '#052E16',
  warning: '#F59E0B',
  expense: '#EF4444',
  expenseLight: '#FEF2F2',
  expenseLightDark: '#2D1F1F',
  income: '#22C55E',
  incomeLight: '#F0FDF4',
  incomeLightDark: '#1F2D1F',
  xpYellow: '#EAB308',
  xpYellowLight: '#FEFCE8',
  xpYellowLightDark: '#2D2A1F',
  badgePurple: '#A855F7',
  badgePurpleLight: '#FAF5FF',
  badgePurpleLightDark: '#261F2D',
  freezeBlue: '#3B82F6',
  freezeBlueLight: '#EFF6FF',
  freezeBlueLightDark: '#1F222D',
  xpBonus: '#7C3AED',
};

export function getDarkModeColors(isDark: boolean) {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
