/**
 * Interrupteurs d'alerte budget (réglages > Notifications). Fonctions pures :
 * aucune dépendance, testables seules.
 *
 * Défauts = comportement historique : 80 % et limite actives, 50 % coupé.
 * Un seuil coupé masque seulement son message/badge d'alerte ; barres,
 * couleurs et montants ne changent pas.
 */
export interface BudgetAlerts {
  alert50: boolean;
  alert80: boolean;
  alert100: boolean;
}

export const DEFAULT_BUDGET_ALERTS: BudgetAlerts = {
  alert50: false,
  alert80: true,
  alert100: true,
};

export const BUDGET_ALERT_KEYS = {
  alert50: 'budget_alert_50',
  alert80: 'budget_alert_80',
  alert100: 'budget_alert_100',
} as const;

export type BudgetAlertId = keyof BudgetAlerts;

/** Lignes brutes `settings` ('1' / '0' / absent) → réglages, défaut si absent ou invalide. */
export function parseBudgetAlerts(rows: Partial<Record<string, string | null>>): BudgetAlerts {
  const read = (id: BudgetAlertId): boolean => {
    const raw = rows[BUDGET_ALERT_KEYS[id]];
    return raw === '1' ? true : raw === '0' ? false : DEFAULT_BUDGET_ALERTS[id];
  };
  return { alert50: read('alert50'), alert80: read('alert80'), alert100: read('alert100') };
}

/** Palier d'alerte atteint par un budget : > 100 → limite, 80-100 → 80 %, 50-79 → 50 %. */
export function alertTier(pct: number): BudgetAlertId | null {
  if (pct > 100) return 'alert100';
  if (pct >= 80) return 'alert80';
  if (pct >= 50) return 'alert50';
  return null;
}

/** Le message d'alerte du palier atteint doit-il s'afficher ? */
export function isAlertVisible(pct: number, alerts: BudgetAlerts): boolean {
  const tier = alertTier(pct);
  return tier !== null && alerts[tier];
}

/** Textes de projection de fin de mois (« dépassement prévu », « dans les clous ») : masqués pour l'instant. */
export const SHOW_BUDGET_PROJECTION = false;
