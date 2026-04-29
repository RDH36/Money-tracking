import { getChartColors, THEME_IDS } from './designTokens';

// Types pour les thèmes
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  accent5: string;
  accent6: string;
  success: string;
  error: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  cardBackground: string;
  border: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  chartColors: string[];
  /** Unlock key required to use this theme (undefined = free). */
  unlockKey?: string;
}

// ─── Hand-crafted theme palettes ────────────────────────────────────────────
// Brand colors are designed, not algorithmically generated.
// Each theme has ONE primary accent — used sparingly on CTA + active states.

const roseTheme: Theme = {
  id: 'rose',
  name: 'Rose',
  colors: {
    primary: '#D9665D',
    primaryLight: '#D9665D14',
    secondary: '#3A8C7E',
    secondaryLight: '#3A8C7E14',
    accent1: '#E08A7B',
    accent2: '#3A8C7E',
    accent3: '#FFCBA4',
    accent4: '#9C3D55',
    accent5: '#F5B197',
    accent6: '#3D7BB6',
    success: '#22C55E',
    error: '#EF4444',
    textPrimary: '#14141A',
    textSecondary: '#6B6B78',
    textMuted: '#9C9CA8',
    background: '#F8F8FA',
    cardBackground: '#FFFFFF',
    border: '#F0F0F4',
  },
  chartColors: getChartColors('turquoise'),
};

const turquoiseTheme: Theme = {
  id: 'turquoise',
  name: 'Turquoise',
  colors: {
    primary: '#38BDB2',
    primaryLight: '#38BDB214',
    secondary: '#FF6B6B',
    secondaryLight: '#FF6B6B14',
    accent1: '#45B7D1',
    accent2: '#96CEB4',
    accent3: '#FFEAA7',
    accent4: '#DDA0DD',
    accent5: '#F39C12',
    accent6: '#3498DB',
    success: '#22C55E',
    error: '#EF4444',
    textPrimary: '#14141A',
    textSecondary: '#6B6B78',
    textMuted: '#9C9CA8',
    background: '#F8F8FA',
    cardBackground: '#FFFFFF',
    border: '#F0F0F4',
  },
  chartColors: getChartColors('turquoise'),
};

const blueTheme: Theme = {
  id: 'blue',
  name: 'Bleu',
  colors: {
    primary: '#3478F6',
    primaryLight: '#3478F614',
    secondary: '#F1C40F',
    secondaryLight: '#F1C40F14',
    accent1: '#9B59B6',
    accent2: '#1ABC9C',
    accent3: '#F1C40F',
    accent4: '#E67E22',
    accent5: '#34495E',
    accent6: '#2ECC71',
    success: '#22C55E',
    error: '#EF4444',
    textPrimary: '#14141A',
    textSecondary: '#6B6B78',
    textMuted: '#9C9CA8',
    background: '#F8F8FA',
    cardBackground: '#FFFFFF',
    border: '#F0F0F4',
  },
  chartColors: getChartColors('blue'),
};

const purpleTheme: Theme = {
  id: 'purple',
  name: 'Violet',
  colors: {
    primary: '#8B4CC8',
    primaryLight: '#8B4CC814',
    secondary: '#2ECC71',
    secondaryLight: '#2ECC7114',
    accent1: '#3498DB',
    accent2: '#1ABC9C',
    accent3: '#F39C12',
    accent4: '#E91E63',
    accent5: '#00BCD4',
    accent6: '#8BC34A',
    success: '#22C55E',
    error: '#EF4444',
    textPrimary: '#14141A',
    textSecondary: '#6B6B78',
    textMuted: '#9C9CA8',
    background: '#F8F8FA',
    cardBackground: '#FFFFFF',
    border: '#F0F0F4',
  },
  chartColors: getChartColors('purple'),
};

const orangeTheme: Theme = {
  id: 'orange',
  name: 'Orange',
  colors: {
    primary: '#EB8C32',
    primaryLight: '#EB8C3214',
    secondary: '#1ABC9C',
    secondaryLight: '#1ABC9C14',
    accent1: '#3498DB',
    accent2: '#27AE60',
    accent3: '#9B59B6',
    accent4: '#1ABC9C',
    accent5: '#E91E63',
    accent6: '#00BCD4',
    success: '#22C55E',
    error: '#EF4444',
    textPrimary: '#14141A',
    textSecondary: '#6B6B78',
    textMuted: '#9C9CA8',
    background: '#F8F8FA',
    cardBackground: '#FFFFFF',
    border: '#F0F0F4',
  },
  chartColors: getChartColors('orange'),
};

// ─── Premium Themes (unlocked via gamification) ────────────────────────────

function makePremiumTheme(
  id: string,
  name: string,
  primary: string,
  secondary: string,
  unlockKey: string
): Theme {
  return {
    id,
    name,
    unlockKey,
    colors: {
      primary,
      primaryLight: primary + '14',
      secondary,
      secondaryLight: secondary + '14',
      accent1: primary,
      accent2: secondary,
      accent3: primary,
      accent4: secondary,
      accent5: primary,
      accent6: secondary,
      success: '#22C55E',
      error: '#EF4444',
      textPrimary: '#14141A',
      textSecondary: '#6B6B78',
      textMuted: '#9C9CA8',
      background: '#F8F8FA',
      cardBackground: '#FFFFFF',
      border: '#F0F0F4',
    },
    chartColors: getChartColors('turquoise'),
  };
}

const premiumThemes: Theme[] = [
  makePremiumTheme('gold', 'Gold', '#D4AF37', '#8B6914', 'theme_gold'),
  makePremiumTheme('platinum', 'Platinum', '#B8B8C1', '#6C6C7A', 'theme_platinum'),
  makePremiumTheme('midnight', 'Midnight', '#1E293B', '#6366F1', 'theme_midnight'),
  makePremiumTheme('ruby', 'Ruby', '#9B1C31', '#E11D48', 'theme_ruby'),
  makePremiumTheme('emerald', 'Emerald', '#047857', '#10B981', 'theme_emerald'),
  makePremiumTheme('prism', 'Prism', '#8B5CF6', '#EC4899', 'theme_prism'),
];

// Liste des thèmes disponibles (base + premium)
export const THEMES: Theme[] = [
  roseTheme, turquoiseTheme, blueTheme, purpleTheme, orangeTheme,
  ...premiumThemes,
];

// Thème par défaut
export const DEFAULT_THEME_ID = 'rose';

// Couleur d'accent figée pour l'onboarding (indépendante du thème utilisateur)
export const ONBOARDING_ACCENT = '#D9665D';

// Fonction pour obtenir un thème par son ID
export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || roseTheme;
}

// Export pour compatibilité
export const COLORS = roseTheme.colors;
export const CHART_COLORS = roseTheme.chartColors;
