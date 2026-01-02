// Types pour les thèmes
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
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
}

// Thème 1 - Turquoise (Moderne)
const turquoiseTheme: Theme = {
  id: 'turquoise',
  name: 'Turquoise',
  colors: {
    primary: '#4ECDC4',
    primaryLight: '#4ECDC420',
    secondary: '#FF6B6B',
    accent1: '#45B7D1',
    accent2: '#96CEB4',
    accent3: '#FFEAA7',
    accent4: '#DDA0DD',
    accent5: '#F39C12',
    accent6: '#3498DB',
    success: '#4ECDC4',
    error: '#FF6B6B',
    textPrimary: '#333',
    textSecondary: '#666',
    textMuted: '#999',
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    border: '#E5E5E5',
  },
  chartColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#3498DB'],
};

// Thème 2 - Bleu (Professionnel)
const blueTheme: Theme = {
  id: 'blue',
  name: 'Bleu',
  colors: {
    primary: '#3498DB',
    primaryLight: '#3498DB20',
    secondary: '#E74C3C',
    accent1: '#9B59B6',
    accent2: '#1ABC9C',
    accent3: '#F1C40F',
    accent4: '#E67E22',
    accent5: '#34495E',
    accent6: '#2ECC71',
    success: '#2ECC71',
    error: '#E74C3C',
    textPrimary: '#2C3E50',
    textSecondary: '#7F8C8D',
    textMuted: '#BDC3C7',
    background: '#ECF0F1',
    cardBackground: '#FFFFFF',
    border: '#D5DBDB',
  },
  chartColors: ['#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F1C40F', '#E67E22', '#34495E', '#2ECC71'],
};

// Thème 3 - Violet (Élégant)
const purpleTheme: Theme = {
  id: 'purple',
  name: 'Violet',
  colors: {
    primary: '#9B59B6',
    primaryLight: '#9B59B620',
    secondary: '#E74C3C',
    accent1: '#3498DB',
    accent2: '#1ABC9C',
    accent3: '#F39C12',
    accent4: '#E91E63',
    accent5: '#00BCD4',
    accent6: '#8BC34A',
    success: '#27AE60',
    error: '#E74C3C',
    textPrimary: '#2C3E50',
    textSecondary: '#666',
    textMuted: '#999',
    background: '#F5F5F5',
    cardBackground: '#FFFFFF',
    border: '#E5E5E5',
  },
  chartColors: ['#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C', '#F39C12', '#E91E63', '#00BCD4', '#8BC34A'],
};

// Thème 4 - Orange (Chaleureux)
const orangeTheme: Theme = {
  id: 'orange',
  name: 'Orange',
  colors: {
    primary: '#F39C12',
    primaryLight: '#F39C1220',
    secondary: '#E74C3C',
    accent1: '#3498DB',
    accent2: '#27AE60',
    accent3: '#9B59B6',
    accent4: '#1ABC9C',
    accent5: '#E91E63',
    accent6: '#00BCD4',
    success: '#27AE60',
    error: '#E74C3C',
    textPrimary: '#333',
    textSecondary: '#666',
    textMuted: '#999',
    background: '#FFF8F0',
    cardBackground: '#FFFFFF',
    border: '#F5E6D3',
  },
  chartColors: ['#E74C3C', '#F39C12', '#3498DB', '#27AE60', '#9B59B6', '#1ABC9C', '#E91E63', '#00BCD4'],
};

// Liste des thèmes disponibles
export const THEMES: Theme[] = [turquoiseTheme, blueTheme, purpleTheme, orangeTheme];

// Thème par défaut
export const DEFAULT_THEME_ID = 'turquoise';

// Fonction pour obtenir un thème par son ID
export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || turquoiseTheme;
}

// Export pour compatibilité (utilise le thème turquoise par défaut)
export const COLORS = turquoiseTheme.colors;
export const CHART_COLORS = turquoiseTheme.chartColors;
