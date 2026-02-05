// Dark mode aware color constants
export const DARK_COLORS = {
  cardBg: '#1C1C1E',
  cardBorder: '#38383A',
  textMuted: '#8E8E93',
  chipBg: '#2C2C2E',
  inputBg: '#1C1C1E',
};

export const LIGHT_COLORS = {
  cardBg: '#FFFFFF',
  cardBorder: '#E5E5E5',
  textMuted: '#666666',
  chipBg: '#F2F2F7',
  inputBg: '#FFFFFF',
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
};

export function getDarkModeColors(isDark: boolean) {
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
