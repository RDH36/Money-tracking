/**
 * Requêtes SQL agrégées du socle d'analyse.
 *
 * Règles :
 * - Toutes les requêtes analytiques filtrent `deleted_at IS NULL AND
 *   transfer_id IS NULL` et bornent sur `transaction_date` → elles exploitent
 *   l'index partiel `idx_tx_analysis (type, transaction_date)` (migration 24).
 * - On agrège au maximum côté SQL et on ne boucle JAMAIS sur des requêtes :
 *   `categoryDrift` est un seul GROUP BY, les totaux par cycle sont des sommes
 *   conditionnelles dans une seule ligne de résultat.
 * - `transaction_date` est un ISO UTC : la comparaison de chaînes `>=` / `<`
 *   équivaut à l'ordre chronologique (cohérent avec useBudgets).
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Cycle } from './types';

const ANALYSIS_WHERE = 'deleted_at IS NULL AND transfer_id IS NULL';

export interface CurrentTotals {
  income: number;
  expenses: number;
  /** Dépenses tombées avant `day7Iso` (7 premiers jours du cycle). */
  first7: number;
}

/**
 * Revenus, dépenses et dépenses des 7 premiers jours — cycle courant, 1 requête.
 * `type IN (...)` + `GROUP BY type` → SQLite fait un seek d'index par type et
 * exploite donc `idx_tx_analysis` (sinon, sans filtre `type`, il retomberait
 * sur un autre index). `first7` n'a de sens que sur la ligne `expense`.
 */
export async function fetchCurrentTotals(
  db: SQLiteDatabase,
  cycle: Cycle,
  day7Iso: string
): Promise<CurrentTotals> {
  const rows = await db.getAllAsync<{ type: string; total: number; first7: number }>(
    `SELECT type,
       COALESCE(SUM(amount), 0) AS total,
       COALESCE(SUM(CASE WHEN transaction_date < ? THEN amount END), 0) AS first7
     FROM transactions
     WHERE ${ANALYSIS_WHERE}
       AND type IN ('income', 'expense')
       AND transaction_date >= ? AND transaction_date < ?
     GROUP BY type`,
    [day7Iso, cycle.start, cycle.end]
  );
  const expense = rows.find((r) => r.type === 'expense');
  return {
    income: rows.find((r) => r.type === 'income')?.total ?? 0,
    expenses: expense?.total ?? 0,
    first7: expense?.first7 ?? 0,
  };
}

export interface CategorySpendRow {
  category_id: string | null;
  /** Dépense de la catégorie sur le cycle courant. */
  cycle_spend: number;
  /** Dépense cumulée de la catégorie sur les cycles précédents de la fenêtre. */
  prev_spend: number;
}

/**
 * Dépense par catégorie sur le cycle courant ET sur les cycles précédents,
 * en UN SEUL GROUP BY (jamais une requête par catégorie). Les deux fenêtres
 * sont séparées par des sommes conditionnelles sur `transaction_date`.
 */
export async function fetchCategorySpend(
  db: SQLiteDatabase,
  curStart: string,
  curEnd: string,
  prevStart: string
): Promise<CategorySpendRow[]> {
  return db.getAllAsync<CategorySpendRow>(
    `SELECT
       category_id,
       COALESCE(SUM(CASE WHEN transaction_date >= ? THEN amount END), 0) AS cycle_spend,
       COALESCE(SUM(CASE WHEN transaction_date <  ? THEN amount END), 0) AS prev_spend
     FROM transactions
     WHERE type = 'expense' AND ${ANALYSIS_WHERE}
       AND transaction_date >= ? AND transaction_date < ?
     GROUP BY category_id`,
    [curStart, curStart, prevStart, curEnd]
  );
}

export interface MonthlyTotal {
  label: string;
  income: number;
  expense: number;
}

/**
 * Revenus / dépenses de chaque cycle fourni, en UNE requête. Requête la plus
 * lourde : plus large fenêtre (jusqu'à 6 cycles) et le plus d'agrégats.
 *
 * `GROUP BY type` (+ `type IN (...)`) fait deux seeks d'index (un par type) →
 * `idx_tx_analysis` est exploité, et chaque colonne conditionnelle ne somme
 * que `amount` (le type est porté par la ligne). Retour aligné sur `cycles`.
 */
export async function fetchMonthlyTotals(
  db: SQLiteDatabase,
  cycles: Cycle[]
): Promise<MonthlyTotal[]> {
  if (cycles.length === 0) return [];
  const cols: string[] = [];
  const params: string[] = [];
  cycles.forEach((c, i) => {
    cols.push(
      `COALESCE(SUM(CASE WHEN transaction_date >= ? AND transaction_date < ? THEN amount END), 0) AS c${i}`
    );
    params.push(c.start, c.end);
  });
  // Fenêtre globale = du plus ancien au plus récent des cycles fournis.
  const spanStart = cycles[cycles.length - 1].start;
  const spanEnd = cycles[0].end;
  params.push(spanStart, spanEnd);

  const rows = await db.getAllAsync<Record<string, number | string>>(
    `SELECT type, ${cols.join(', ')}
     FROM transactions
     WHERE ${ANALYSIS_WHERE}
       AND type IN ('income', 'expense')
       AND transaction_date >= ? AND transaction_date < ?
     GROUP BY type`,
    params
  );
  const incomeRow = rows.find((r) => r.type === 'income');
  const expenseRow = rows.find((r) => r.type === 'expense');
  return cycles.map((c, i) => ({
    label: c.label,
    income: Number(incomeRow?.[`c${i}`] ?? 0),
    expense: Number(expenseRow?.[`c${i}`] ?? 0),
  }));
}

export interface MicroTotals {
  cnt: number;
  total: number;
}

/** Nombre et somme des micro-dépenses (< seuil) sur le cycle courant. */
export async function fetchMicro(
  db: SQLiteDatabase,
  curStart: string,
  curEnd: string,
  threshold: number
): Promise<MicroTotals> {
  const row = await db.getFirstAsync<MicroTotals>(
    `SELECT COUNT(*) AS cnt, COALESCE(SUM(amount), 0) AS total
     FROM transactions
     WHERE type = 'expense' AND ${ANALYSIS_WHERE}
       AND transaction_date >= ? AND transaction_date < ?
       AND amount < ?`,
    [curStart, curEnd, threshold]
  );
  return row ?? { cnt: 0, total: 0 };
}

export interface ExpenseRow {
  category_id: string | null;
  amount: number;
  transaction_date: string;
}

/**
 * Dépenses au niveau ligne sur une fenêtre (pour la détection des récurrences
 * et le comptage des jours sans dépense). Une seule requête, triée pour un
 * traitement séquentiel en JS — aucune boucle SQL.
 */
export async function fetchExpenseRows(
  db: SQLiteDatabase,
  start: string,
  end: string
): Promise<ExpenseRow[]> {
  return db.getAllAsync<ExpenseRow>(
    `SELECT category_id, amount, transaction_date
     FROM transactions
     WHERE type = 'expense' AND ${ANALYSIS_WHERE}
       AND transaction_date >= ? AND transaction_date < ?
     ORDER BY category_id, transaction_date`,
    [start, end]
  );
}

export interface BudgetLimitRow {
  category_id: string;
  category_name: string;
  budget_limit: number;
}

/**
 * Plafonds de budget du cycle. Cycle courant → `categories.budget_limit`
 * (source de vérité affichée par useBudgets) ; cycle passé → `budget_history`
 * du mois. Une requête dans les deux cas.
 */
export async function fetchBudgetLimits(
  db: SQLiteDatabase,
  cycle: Cycle
): Promise<BudgetLimitRow[]> {
  if (cycle.isCurrent) {
    return db.getAllAsync<BudgetLimitRow>(
      `SELECT id AS category_id, name AS category_name, budget_limit
       FROM categories
       WHERE deleted_at IS NULL AND budget_limit IS NOT NULL AND budget_limit > 0`
    );
  }
  return db.getAllAsync<BudgetLimitRow>(
    `SELECT bh.category_id, c.name AS category_name, bh.budget_limit
     FROM budget_history bh
     JOIN categories c ON c.id = bh.category_id AND c.deleted_at IS NULL
     WHERE bh.year_month = ? AND bh.budget_limit > 0`,
    [cycle.label]
  );
}

/** Table id → nom des catégories vivantes (pour nommer les dérives). */
export async function fetchCategoryNames(db: SQLiteDatabase): Promise<Map<string, string>> {
  const rows = await db.getAllAsync<{ id: string; name: string }>(
    `SELECT id, name FROM categories WHERE deleted_at IS NULL`
  );
  return new Map(rows.map((r) => [r.id, r.name]));
}

/**
 * Solde total liquide = Σ(solde initial) + Σ(revenus − dépenses) sur les comptes
 * vivants. Les virements s'annulent d'un compte à l'autre : on ne les exclut
 * pas ici (c'est un état de trésorerie, pas un agrégat de cycle).
 */
export async function fetchLiquidBalance(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ balance: number }>(
    `SELECT
       (SELECT COALESCE(SUM(initial_balance), 0) FROM accounts WHERE deleted_at IS NULL)
       + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount
                           WHEN t.type = 'expense' THEN -t.amount ELSE 0 END), 0) AS balance
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id AND a.deleted_at IS NULL
     WHERE t.deleted_at IS NULL`
  );
  return row?.balance ?? 0;
}
