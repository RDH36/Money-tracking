/**
 * Détection du cycle de paye depuis l'historique (Phase 7) — fonction pure
 * côté calcul, une seule requête SQL, aucune dépendance React.
 *
 * Revenus des 6 derniers mois (hors virements) :
 * - chaîne mensuelle (écart 25–35 j, montant ±10 %) via `longestMonthlyChain`,
 *   la même heuristique que les dépenses récurrentes ;
 * - chaîne ≥ 3 → `payday` (jour = médiane basse des jours du mois, montant = médiane) ;
 * - revenus présents mais dispersés → `irregular` (médiane des sommes mensuelles) ;
 * - aucun revenu → `calendar`, rien à proposer.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { longestMonthlyChain, type DatedAmount } from './indicators';
import type { CycleMode } from './types';

/** Fenêtre d'observation, en mois. */
const LOOKBACK_MONTHS = 6;
/** Occurrences minimales pour proposer un jour de paye. */
const MIN_CHAIN = 3;
/** Tolérance de montant entre deux payes (±10 %). */
const INCOME_TOLERANCE = 0.1;

export interface PaydayDetection {
  mode: CycleMode;
  /** Jour de paye proposé (1–31), `null` hors mode `payday`. */
  payDay: number | null;
  /** Revenu attendu par cycle, en centimes, ou `null` si rien d'exploitable. */
  expectedIncome: number | null;
  /** Occurrences retrouvées ÷ payes attendues sur la fenêtre, borné à 1. */
  confidence: number;
  /** Nombre d'occurrences de la chaîne retenue (0 hors `payday`). */
  occurrences: number;
}

/** Médiane d'une liste non vide (moyenne des deux centrales si pair), arrondie. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(m);
}

/**
 * Médiane BASSE des jours du mois (élément central inférieur si pair) : en cas
 * d'égalité on retient le jour le plus tôt — une paye qui tombe un peu plus
 * tard reste dans le bon cycle, alors qu'un jour trop tardif la ferait
 * basculer dans le cycle précédent.
 */
function lowerMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** Clé mois local 'YYYY-MM' d'une date ISO. */
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Revenus (hors virements) depuis `sinceIso`, triés — exploite `idx_tx_analysis`. */
async function fetchIncomeRows(db: SQLiteDatabase, sinceIso: string): Promise<DatedAmount[]> {
  return db.getAllAsync<DatedAmount>(
    `SELECT amount, transaction_date
     FROM transactions
     WHERE type = 'income' AND deleted_at IS NULL AND transfer_id IS NULL
       AND transaction_date >= ?
     ORDER BY transaction_date`,
    [sinceIso]
  );
}

/**
 * Nombre de payes attendues entre `from` et `to` (bornes incluses) pour un jour
 * de paye donné : les « cycles observés » du dénominateur de la confiance.
 * `from` est ramené au premier revenu connu, sinon un historique de 3 mois
 * n'atteindrait jamais une confiance de 1.
 */
function countExpectedPaydays(payDay: number, from: Date, to: Date): number {
  let count = 0;
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const pay = new Date(y, m, Math.min(payDay, lastDay));
    if (pay >= from && pay <= to) count++;
    cursor.setMonth(m + 1);
  }
  return count;
}

/** Cœur pur de la détection, testable sans base. */
export function detectPaydayFromRows(rows: DatedAmount[], now: Date = new Date()): PaydayDetection {
  const incomes = rows.filter((r) => r.amount > 0);
  if (incomes.length === 0) {
    return { mode: 'calendar', payDay: null, expectedIncome: null, confidence: 0, occurrences: 0 };
  }

  const chain = longestMonthlyChain(incomes, INCOME_TOLERANCE);
  if (chain.length >= MIN_CHAIN) {
    const payDay = lowerMedian(chain.map((r) => new Date(r.transaction_date).getDate()));
    const expectedIncome = median(chain.map((r) => r.amount));
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const first = new Date(incomes[0].transaction_date);
    const from = new Date(first.getFullYear(), first.getMonth(), first.getDate());
    const expected = Math.max(1, countExpectedPaydays(payDay, from, today));
    return {
      mode: 'payday',
      payDay,
      expectedIncome,
      confidence: Math.min(1, chain.length / expected),
      occurrences: chain.length,
    };
  }

  // Revenus dispersés : médiane des sommes mensuelles, mois courant (partiel)
  // exclu dès qu'un autre mois existe.
  const byMonth = new Map<string, number>();
  for (const r of incomes) {
    const k = monthKey(r.transaction_date);
    byMonth.set(k, (byMonth.get(k) ?? 0) + r.amount);
  }
  const currentKey = monthKey(now.toISOString());
  const sums = [...byMonth.entries()].filter(([k]) => k !== currentKey).map(([, v]) => v);
  const monthly = sums.length > 0 ? sums : [...byMonth.values()];
  return {
    mode: 'irregular',
    payDay: null,
    expectedIncome: monthly.length > 0 ? median(monthly) : null,
    confidence: 0,
    occurrences: 0,
  };
}

/** Détection depuis la base : revenus des 6 derniers mois, une seule requête. */
export async function detectPayday(db: SQLiteDatabase, now: Date = new Date()): Promise<PaydayDetection> {
  const since = new Date(now.getFullYear(), now.getMonth() - LOOKBACK_MONTHS, now.getDate());
  const rows = await fetchIncomeRows(db, since.toISOString());
  return detectPaydayFromRows(rows, now);
}
