import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { ensureCurrentMonthBudgetHistory } from '@/lib/database/budgetHistory';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import type { Category } from '@/types';

export interface BudgetData {
  category: Category;
  spent: number;
  budgetLimit: number | null;
  percentage: number | null;
  status: 'green' | 'orange' | 'red' | null;
  timeUntilReset: string;
}

function getLocalMonthBounds() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { monthStart: monthStart.toISOString(), monthEnd: monthEnd.toISOString() };
}

function getTimeUntilReset(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = nextMonth.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getBudgetStatus(percentage: number): 'green' | 'orange' | 'red' {
  if (percentage >= 100) return 'red';
  if (percentage >= 70) return 'orange';
  return 'green';
}

export function useBudgets() {
  const db = useSQLiteContext();
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      // Ensure current month has a budget_history row carried over from the
      // previous month for each category with an active limit. Idempotent —
      // preserves manual edits for the current month (INSERT OR IGNORE).
      await ensureCurrentMonthBudgetHistory(db);
      const { monthStart, monthEnd } = getLocalMonthBounds();

      const categories = await db.getAllAsync<Category>(
        `SELECT * FROM categories
         WHERE deleted_at IS NULL
           AND category_type = 'expense'
         ORDER BY name ASC`
      );

      const spentRows = await db.getAllAsync<{ category_id: string | null; total: number }>(
        `SELECT category_id, SUM(amount) as total
         FROM transactions
         WHERE type = 'expense'
           AND deleted_at IS NULL
           AND transfer_id IS NULL
           AND created_at >= ?
           AND created_at < ?
         GROUP BY category_id`,
        [monthStart, monthEnd]
      );

      const spentMap = new Map<string, number>();
      const uncategorizedSpent = { total: 0 };
      for (const r of spentRows) {
        if (r.category_id) {
          spentMap.set(r.category_id, (spentMap.get(r.category_id) ?? 0) + r.total);
        } else {
          uncategorizedSpent.total += r.total;
        }
      }
      const timeUntilReset = getTimeUntilReset();

      const result: BudgetData[] = categories.map((cat) => {
        let spent = spentMap.get(cat.id) ?? 0;
        if (cat.id === 'other') spent += uncategorizedSpent.total;
        const budgetLimit = cat.budget_limit;
        const percentage = budgetLimit ? Math.round((spent / budgetLimit) * 100) : null;
        const status = percentage !== null ? getBudgetStatus(percentage) : null;

        return { category: cat, spent, budgetLimit, percentage, status, timeUntilReset };
      });

      result.sort((a, b) => {
        if (a.budgetLimit && !b.budgetLimit) return -1;
        if (!a.budgetLimit && b.budgetLimit) return 1;
        if (a.percentage !== null && b.percentage !== null) return b.percentage - a.percentage;
        return b.spent - a.spent;
      });

      setBudgets(result);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const budgetsVersion = useDataRefreshStore((s) => s.budgetsVersion);
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, budgetsVersion]);

  const overspentBudgets = useMemo(
    () => budgets.filter((b) => b.status === 'red'),
    [budgets]
  );

  const topBudgets = useMemo(() => budgets.slice(0, 3), [budgets]);

  return {
    budgets,
    overspentBudgets,
    topBudgets,
    isLoading,
    refresh: fetchBudgets,
    getTimeUntilReset,
  };
}

export function useCategoryBudget(categoryId: string, monthOffset = 0) {
  const db = useSQLiteContext();
  const [spent, setSpent] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState<number | null>(null);

  const fetchCategoryBudget = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);

      const yearMonth = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      // Check history first for past months, fallback to current budget_limit
      const history = await db.getFirstAsync<{ budget_limit: number }>(
        'SELECT budget_limit FROM budget_history WHERE category_id = ? AND year_month = ?',
        [categoryId, yearMonth]
      );

      if (history) {
        setBudgetLimit(history.budget_limit);
      } else if (monthOffset === 0) {
        // Current month: use current budget_limit
        const cat = await db.getFirstAsync<{ budget_limit: number | null }>(
          'SELECT budget_limit FROM categories WHERE id = ?',
          [categoryId]
        );
        setBudgetLimit(cat?.budget_limit ?? null);
      } else {
        // Past month with no history: was unlimited
        setBudgetLimit(null);
      }

      const categoryFilter = categoryId === 'other'
        ? `(category_id = ? OR category_id IS NULL)`
        : `category_id = ?`;

      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM transactions
         WHERE ${categoryFilter}
           AND type = 'expense'
           AND deleted_at IS NULL
           AND transfer_id IS NULL
           AND created_at >= ?
           AND created_at < ?`,
        [categoryId, monthStart.toISOString(), monthEnd.toISOString()]
      );
      setSpent(result?.total ?? 0);
    } catch (error) {
      console.error('Error fetching category budget:', error);
    }
  }, [db, categoryId, monthOffset]);

  useEffect(() => {
    fetchCategoryBudget();
  }, [fetchCategoryBudget]);

  const percentage = budgetLimit ? Math.round((spent / budgetLimit) * 100) : null;
  const status = percentage !== null ? getBudgetStatus(percentage) : null;

  return { spent, budgetLimit, percentage, status, refresh: fetchCategoryBudget };
}

export interface PeriodBudgetData {
  categoryId: string;
  cumulBudget: number | null;
  percentage: number | null;
  status: 'green' | 'orange' | 'red' | null;
}

export function useBudgetForPeriod(period: 'day' | 'week' | 'month' | 'year', date: Date) {
  const db = useSQLiteContext();
  const [periodBudgets, setPeriodBudgets] = useState<Map<string, PeriodBudgetData>>(new Map());

  const fetchPeriodBudgets = useCallback(async () => {
    try {
      // Backfill current month's budget_history before aggregating, so the
      // annual cumulative report correctly includes the current month even
      // when the user hasn't manually set a new threshold.
      await ensureCurrentMonthBudgetHistory(db);
      const year = date.getFullYear();

      if (period === 'year') {
        const months: string[] = [];
        for (let m = 0; m < 12; m++) {
          months.push(`${year}-${String(m + 1).padStart(2, '0')}`);
        }

        const rows = await db.getAllAsync<{ category_id: string; total_budget: number }>(
          `SELECT category_id, SUM(budget_limit) as total_budget
           FROM budget_history
           WHERE year_month IN (${months.map(() => '?').join(',')})
           GROUP BY category_id`,
          months
        );

        const map = new Map<string, PeriodBudgetData>();
        for (const row of rows) {
          map.set(row.category_id, {
            categoryId: row.category_id,
            cumulBudget: row.total_budget,
            percentage: null,
            status: null,
          });
        }
        setPeriodBudgets(map);
      } else if (period === 'month') {
        const yearMonth = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const rows = await db.getAllAsync<{ category_id: string; budget_limit: number }>(
          `SELECT category_id, budget_limit FROM budget_history WHERE year_month = ?`,
          [yearMonth]
        );

        const map = new Map<string, PeriodBudgetData>();
        for (const row of rows) {
          map.set(row.category_id, {
            categoryId: row.category_id,
            cumulBudget: row.budget_limit,
            percentage: null,
            status: null,
          });
        }

        if (map.size === 0) {
          const cats = await db.getAllAsync<{ id: string; budget_limit: number }>(
            `SELECT id, budget_limit FROM categories WHERE budget_limit IS NOT NULL AND deleted_at IS NULL`
          );
          for (const cat of cats) {
            map.set(cat.id, { categoryId: cat.id, cumulBudget: cat.budget_limit, percentage: null, status: null });
          }
        }
        setPeriodBudgets(map);
      } else {
        setPeriodBudgets(new Map());
      }
    } catch (error) {
      console.error('Error fetching period budgets:', error);
    }
  }, [db, period, date.getFullYear(), date.getMonth()]);

  useEffect(() => {
    fetchPeriodBudgets();
  }, [fetchPeriodBudgets]);

  const getBudgetForCategory = useCallback((categoryId: string, spent: number): PeriodBudgetData | null => {
    const data = periodBudgets.get(categoryId);
    if (!data || !data.cumulBudget) return null;
    const pct = Math.round((spent / data.cumulBudget) * 100);
    return {
      ...data,
      percentage: pct,
      status: getBudgetStatus(pct),
    };
  }, [periodBudgets]);

  return { periodBudgets, getBudgetForCategory, refresh: fetchPeriodBudgets };
}
