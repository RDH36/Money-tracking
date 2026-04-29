import { useMemo } from 'react';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { useTheme } from '@/contexts';

export interface V2Tokens {
  bgBase: string;
  bgSurface: string;
  bgRaised: string;
  bgInk: string;
  bgInkSoft: string;
  brand: string;
  brandDeep: string;
  brandSoft: string;
  brandTint: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkOnDark: string;
  inkOnDarkM: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  hairline: string;
  hairlineStrong: string;
  fontDisplay: string;
  fontUI: string;
  fontUIRegular: string;
}

const FONTS = {
  fontDisplay: 'PlusJakartaSans-Bold',
  fontUI: 'PlusJakartaSans-SemiBold',
  fontUIRegular: 'Inter-Regular',
};

const LIGHT: V2Tokens = {
  bgBase: '#F0EBE0',
  bgSurface: '#FFFFFF',
  bgRaised: '#E5DFD0',
  bgInk: '#16201E',
  bgInkSoft: '#1F2A28',

  brand: '#0E8C82',
  brandDeep: '#0A6B63',
  brandSoft: 'rgba(14,140,130,0.10)',
  brandTint: '#E6F2F0',

  ink: '#0F1311',
  inkMuted: '#5C6664',
  inkSubtle: '#8B9491',
  inkOnDark: '#F5F5F1',
  inkOnDarkM: 'rgba(245,245,241,0.62)',

  good: '#16A371',
  goodSoft: '#E6F4EE',
  warn: '#C8851A',
  warnSoft: '#FBF1DE',
  bad: '#C8442C',
  badSoft: '#FBE9E3',

  hairline: 'rgba(15,19,17,0.08)',
  hairlineStrong: 'rgba(15,19,17,0.14)',

  ...FONTS,
};

const DARK: V2Tokens = {
  bgBase: '#0F1311',
  bgSurface: '#1A2120',
  bgRaised: '#2A3433',
  bgInk: '#243130',
  bgInkSoft: '#2E3D3C',

  brand: '#14B8A6',
  brandDeep: '#0E8C82',
  brandSoft: 'rgba(20,184,166,0.15)',
  brandTint: 'rgba(20,184,166,0.10)',

  ink: '#F5F5F1',
  inkMuted: '#A8B0AE',
  inkSubtle: '#6E7775',
  inkOnDark: '#F5F5F1',
  inkOnDarkM: 'rgba(245,245,241,0.62)',

  good: '#34D399',
  goodSoft: 'rgba(52,211,153,0.15)',
  warn: '#E0A93A',
  warnSoft: 'rgba(224,169,58,0.15)',
  bad: '#EF6A4F',
  badSoft: 'rgba(239,106,79,0.18)',

  hairline: 'rgba(245,245,241,0.10)',
  hairlineStrong: 'rgba(245,245,241,0.18)',

  ...FONTS,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

function adjust(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount < 0 ? v : 255 - v) * amount)));
  const to = (v: number) => f(v).toString(16).padStart(2, '0');
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`.toUpperCase();
}

export function useV2(): V2Tokens {
  const isDark = useEffectiveColorScheme() === 'dark';
  const { theme } = useTheme();
  const primary = theme.colors.primary;

  return useMemo(() => {
    const base = isDark ? DARK : LIGHT;
    return {
      ...base,
      brand: primary,
      brandDeep: isDark ? adjust(primary, 0.15) : adjust(primary, -0.18),
      brandSoft: withAlpha(primary, isDark ? 0.18 : 0.10),
      brandTint: isDark ? withAlpha(primary, 0.10) : withAlpha(primary, 0.08),
    };
  }, [isDark, primary]);
}

/**
 * @deprecated Prefer `useV2()` inside components for dark-mode support.
 * Kept for non-component constants and migration convenience.
 */
export const V2 = LIGHT;

const numberFormatterFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

/**
 * Format an amount stored as cents (DB convention) for display.
 * Divides by 100 then formats with French thousands separators.
 * Example: 50000000 (cents) → "500 000" (MGA).
 */
export function formatMoneyFr(amountInCents: number): string {
  const amount = Math.abs(amountInCents) / 100;
  return numberFormatterFr.format(amount);
}
