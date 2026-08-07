/**
 * Calcul des 12 indicateurs — fonctions pures, aucune dépendance React.
 *
 * `getIndicators(db, cycle)` fait le minimum de requêtes : un premier appel pour
 * les totaux (dont dépend le seuil micro), puis toutes les autres en parallèle.
 * Aucune boucle sur du SQL. Toute division dont le dénominateur peut valoir 0
 * est gardée → jamais `NaN`, jamais `Infinity`, `null` à la place.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { BestCycle, BudgetStatus, CategoryDrift, Cycle, Indicators, RecurringExpense } from './types';
import { getPreviousCycles } from './cycle';
import {
  fetchBudgetLimits,
  fetchCategoryNames,
  fetchCategorySpend,
  fetchCurrentTotals,
  fetchExpenseRows,
  fetchLiquidBalance,
  fetchMicro,
  fetchMonthlyTotals,
  type ExpenseRow,
} from './queries';

const DAY_MS = 86_400_000;

/**
 * Seuil micro-dépense dérivé du revenu : `revenuMensuel / 200`, plancher
 * 1 000 Ar, arrondi au millier d'Ar. Jamais une constante. Entrée/sortie en
 * centimes (1 Ar = 100 centimes).
 */
export function computeMicroThreshold(incomeCentimes: number): number {
  const rawAr = incomeCentimes / 100 / 200;
  const roundedAr = Math.round(rawAr / 1000) * 1000;
  const flooredAr = Math.max(1000, roundedAr);
  return flooredAr * 100;
}

/** Plus longue chaîne de dépenses à cadence mensuelle (gap 25–35 j, montant ±15 %). */
function longestMonthlyChain(list: ExpenseRow[]): ExpenseRow[] {
  const rows = [...list].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
  let best: ExpenseRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const chain = [rows[i]];
    let sum = rows[i].amount;
    let lastTime = new Date(rows[i].transaction_date).getTime();
    for (let j = i + 1; j < rows.length; j++) {
      const gapDays = (new Date(rows[j].transaction_date).getTime() - lastTime) / DAY_MS;
      if (gapDays < 25) continue; // même mois : on saute le doublon
      if (gapDays > 35) break; // cadence rompue
      const avg = sum / chain.length;
      if (avg > 0 && Math.abs(rows[j].amount - avg) / avg > 0.15) continue; // hors ±15 %
      chain.push(rows[j]);
      sum += rows[j].amount;
      lastTime = new Date(rows[j].transaction_date).getTime();
    }
    if (chain.length > best.length) best = chain;
  }
  return best;
}

/** Détection heuristique des dépenses récurrentes, une par catégorie éligible. */
export function detectRecurring(rows: ExpenseRow[]): RecurringExpense[] {
  const byCat = new Map<string, ExpenseRow[]>();
  for (const r of rows) {
    if (!r.category_id) continue; // une récurrence a besoin d'une catégorie identifiée
    const list = byCat.get(r.category_id);
    if (list) list.push(r);
    else byCat.set(r.category_id, [r]);
  }
  const out: RecurringExpense[] = [];
  for (const [categoryId, list] of byCat) {
    const chain = longestMonthlyChain(list);
    if (chain.length < 3) continue; // au moins 3 occurrences
    const occurrences = Math.min(4, chain.length);
    const avgAmount = Math.round(chain.reduce((s, r) => s + r.amount, 0) / chain.length);
    const avgDay = Math.round(
      chain.reduce((s, r) => s + new Date(r.transaction_date).getDate(), 0) / chain.length
    );
    out.push({ categoryId, avgAmount, dayOfMonth: avgDay, occurrences, confidence: Math.min(1, occurrences / 4) });
  }
  return out;
}

/** Jours écoulés du cycle sans aucune dépense (jours locaux distincts). */
function computeNoSpendDays(rows: ExpenseRow[], cycle: Cycle): number {
  const days = new Set<string>();
  for (const r of rows) {
    if (r.transaction_date < cycle.start || r.transaction_date >= cycle.end) continue;
    const d = new Date(r.transaction_date);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return Math.max(0, cycle.elapsedDays - days.size);
}

export async function getIndicators(db: SQLiteDatabase, cycle: Cycle): Promise<Indicators> {
  // Cycles précédents RELATIFS au cycle analysé (milieu de mois → sans ambiguïté
  // de fuseau), du plus récent au plus ancien.
  const [year, month] = cycle.label.split('-').map(Number);
  const prev = getPreviousCycles(6, new Date(year, month - 1, 15));
  const prev3Start = prev[2].start; // début du 3ᵉ cycle précédent
  const day7Iso = new Date(new Date(cycle.start).getTime() + 7 * DAY_MS).toISOString();

  // Totaux d'abord : le seuil micro en dépend.
  const totals = await fetchCurrentTotals(db, cycle, day7Iso);
  const income = totals.income;
  const expenses = totals.expenses;
  const microThreshold = computeMicroThreshold(income);

  // Le reste est indépendant → en parallèle.
  const [catSpend, monthly, micro, expenseRows, catNames, liquid, budgetLimits] = await Promise.all([
    fetchCategorySpend(db, cycle.start, cycle.end, prev3Start),
    fetchMonthlyTotals(db, prev), // 6 cycles précédents
    fetchMicro(db, cycle.start, cycle.end, microThreshold),
    fetchExpenseRows(db, prev3Start, cycle.end), // fenêtre 4 cycles (récurrences)
    fetchCategoryNames(db),
    fetchLiquidBalance(db),
    fetchBudgetLimits(db, cycle),
  ]);

  const cyclesAvailable = monthly.filter((m) => m.income > 0 || m.expense > 0).length;

  // Moyenne mensuelle des dépenses sur les 3 cycles précédents PRÉSENTS.
  const prev3 = monthly.slice(0, 3);
  const nPrev3 = prev3.filter((m) => m.income > 0 || m.expense > 0).length;
  const prev3ExpenseTotal = prev3.reduce((s, m) => s + m.expense, 0);
  const avgMonthlyExpense3 = nPrev3 > 0 ? prev3ExpenseTotal / nPrev3 : null;

  // Récurrences → coûts fixes.
  const recurring = detectRecurring(expenseRows);
  const recurringSum = recurring.reduce((s, r) => s + r.avgAmount, 0);

  // Concentration : part de la 1ʳᵉ catégorie.
  const topSpend = catSpend.reduce((max, r) => Math.max(max, r.cycle_spend), 0);

  // Dérive par catégorie (dépensées ce cycle), triée par poids décroissant.
  const categoryDrift: CategoryDrift[] = catSpend
    .filter((r) => r.cycle_spend > 0)
    .map((r) => {
      const avgPrevious = nPrev3 > 0 ? r.prev_spend / nPrev3 : null;
      const drift = avgPrevious && avgPrevious > 0 ? r.cycle_spend / avgPrevious : null;
      return {
        categoryId: r.category_id ?? 'other',
        categoryName: r.category_id ? catNames.get(r.category_id) ?? null : null,
        cycleSpend: r.cycle_spend,
        avgPrevious,
        drift,
      };
    })
    .sort((a, b) => b.cycleSpend - a.cycleSpend);

  // Budgets du cycle (Phase 6) : croisement plafonds × dépenses déjà agrégées.
  const spentByCat = new Map<string, number>();
  for (const r of catSpend) if (r.category_id) spentByCat.set(r.category_id, r.cycle_spend);
  const budgets: BudgetStatus[] = budgetLimits.map((b) => {
    const spent = spentByCat.get(b.category_id) ?? 0;
    return {
      categoryId: b.category_id,
      categoryName: b.category_name,
      limit: b.budget_limit,
      spent,
      projected: Math.round(spent / cycle.elapsedRatio),
    };
  });

  // Meilleur des 6 cycles précédents (taux d'épargne).
  let bestCycle: BestCycle | null = null;
  for (const m of monthly) {
    if (m.income <= 0) continue;
    const sr = (m.income - m.expense) / m.income;
    if (!bestCycle || sr > bestCycle.savingsRate) bestCycle = { label: m.label, savingsRate: sr };
  }

  return {
    cycle,
    income,
    expenses,
    microThreshold,
    cyclesAvailable,

    savingsRate: income > 0 ? (income - expenses) / income : null,
    keptAmount: income - expenses,
    fixedShare: income > 0 ? recurringSum / income : null,
    realDisposable: income > 0 ? income - recurringSum : null,
    monthsCovered: avgMonthlyExpense3 && avgMonthlyExpense3 > 0 ? liquid / avgMonthlyExpense3 : null,

    burnSpeed: income > 0 ? totals.first7 / income : null,
    microCount: micro.cnt,
    microTotal: micro.total,
    noSpendDays: computeNoSpendDays(expenseRows, cycle),
    concentration: expenses > 0 ? topSpend / expenses : null,

    budgets,
    categoryDrift,
    projectedEnd: Math.round(expenses / cycle.elapsedRatio),
    bestCycle,
    sinceLastAnalysis: null,

    recurring,
  };
}
