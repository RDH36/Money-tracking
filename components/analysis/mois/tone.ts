import type { Ionicons } from '@expo/vector-icons';
import { formatMoneyFr, type V2Tokens } from '@/constants/designTokensV2';
import type { VerdictStatus } from '@/lib/analysis/verdict';
import type { InsightSeverity } from '@/lib/analysis/types';

export type IonName = keyof typeof Ionicons.glyphMap;

/** Couleur hex (ou rgba déjà formée) avec une opacité donnée. */
export function alpha(color: string, a: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!m) return color;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

/** Éclaircit une couleur hex vers le blanc (`amount` 0–1) : teinte claire sur fond sombre. */
export function lighten(color: string, amount: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!m) return color;
  const mix = (h: string) => Math.round(parseInt(h, 16) + (255 - parseInt(h, 16)) * amount).toString(16).padStart(2, '0');
  return `#${mix(m[1])}${mix(m[2])}${mix(m[3])}`.toUpperCase();
}

export interface StatusTone {
  color: string;
  /** Teinte claire lisible sur la carte sombre (maquette : #7DD3A6 pour le vert). */
  onDark: string;
  /** Fond doux de la pastille en clair. */
  soft: string;
  icon: IonName;
  /** Clé i18n du libellé (`analysis.verdict.*`). */
  labelKey: string;
}

/** Teinte + icône + libellé d'un statut de verdict. `unknown` reste neutre. */
export function statusTone(v2: V2Tokens, status: VerdictStatus): StatusTone {
  switch (status) {
    case 'green':
      return { color: v2.good, onDark: lighten(v2.good, 0.45), soft: v2.goodSoft, icon: 'checkmark', labelKey: 'analysis.verdict.green' };
    case 'orange':
      return { color: v2.warn, onDark: lighten(v2.warn, 0.4), soft: v2.warnSoft, icon: 'remove', labelKey: 'analysis.verdict.orange' };
    case 'red':
      return { color: v2.bad, onDark: lighten(v2.bad, 0.4), soft: v2.badSoft, icon: 'close', labelKey: 'analysis.verdict.red' };
    default:
      return { color: v2.inkMuted, onDark: v2.inkOnDarkM, soft: v2.bgRaised, icon: 'help', labelKey: 'analysis.verdict.unknown' };
  }
}

/** « 12 % » — taux gardé, arrondi à l'entier. */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

/** Montant signé : « +595 226 » ou « −120 000 » (formatMoneyFr rend l'absolu). */
export function signed(formatted: string, amount: number): string {
  return `${amount < 0 ? '−' : '+'}${formatted}`;
}

/**
 * Étiquette de cycle (`YYYY-MM` ou `YYYY-MM-DD`) rendue en nom de mois :
 * « juillet ». En mode paye, on nomme le mois qui contient la plus grande part
 * du cycle (paye le 29 avril → « mai »). Repli sur l'étiquette brute si `Intl`
 * manque de la locale.
 */
export function formatCycleLabel(label: string, lang: string): string {
  const [y, m, d] = label.split('-').map(Number);
  if (!y || !m) return label;
  const monthIndex = d && d >= 16 ? m : m - 1;
  const date = new Date(y, monthIndex, 1);
  try {
    return date.toLocaleDateString(lang, { month: 'long' });
  } catch {
    return label;
  }
}

/** Montant à l'ariary entier (les centimes n'ont pas leur place dans un verdict). */
export function formatWhole(centimes: number): string {
  return formatMoneyFr(Math.round(centimes / 100) * 100);
}

/** Icône d'un constat : par règle (préfixe de l'id), sinon par sévérité. */
const RULE_ICONS: Record<string, IonName> = {
  microSpending: 'cafe-outline',
  burnSpeed: 'speedometer-outline',
  projection: 'trending-up-outline',
  fixedCosts: 'repeat-outline',
  categoryDrift: 'swap-vertical-outline',
  budgetOverrun: 'wallet-outline',
  budgetUnused: 'wallet-outline',
  savingsRate: 'leaf-outline',
  bestCycle: 'trophy-outline',
  goalGap: 'flag-outline',
  topCategory: 'pie-chart-outline',
  noSpendStreak: 'calendar-outline',
};

export function insightIcon(id: string, severity: InsightSeverity): IonName {
  const base = id.split(':')[0];
  if (RULE_ICONS[base]) return RULE_ICONS[base];
  return severity === 'urgent' ? 'alert-circle-outline' : severity === 'watch' ? 'eye-outline' : 'information-circle-outline';
}

/** Fond + encre du carré d'icône d'un constat, selon la sévérité. */
export function severityTone(v2: V2Tokens, severity: InsightSeverity): { bg: string; fg: string } {
  if (severity === 'urgent') return { bg: v2.badSoft, fg: v2.bad };
  if (severity === 'watch') return { bg: v2.warnSoft, fg: v2.warn };
  return { bg: v2.bgRaised, fg: v2.inkMuted };
}
