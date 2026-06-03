import { useEffect, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { parseAmount, getNumericValue } from '@/lib/amountInput';
import type { Category } from '@/types';

export interface BudgetPreview {
  spent: string;
  limit: string;
  percentage: number;
}

interface Params {
  active: boolean;
  amount: string;
  categoryId: string | null;
  expenseCategories: Category[];
  formatMoney: (n: number) => string;
  /** Month to preview the budget for. Defaults to the current month. */
  date?: Date;
}

export function useBudgetPreview({
  active,
  amount,
  categoryId,
  expenseCategories,
  formatMoney,
  date,
}: Params): BudgetPreview | null {
  const db = useSQLiteContext();
  const [preview, setPreview] = useState<BudgetPreview | null>(null);

  useEffect(() => {
    if (!active || !categoryId) {
      setPreview(null);
      return;
    }
    const cat = expenseCategories.find((c) => c.id === categoryId);
    if (!cat?.budget_limit || getNumericValue(amount) <= 0) {
      setPreview(null);
      return;
    }
    const amountValue = parseAmount(amount);
    let cancelled = false;
    (async () => {
      const ref = date ?? new Date();
      const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString();
      const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 1).toISOString();
      const result = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE category_id = ? AND type = 'expense' AND deleted_at IS NULL
           AND transfer_id IS NULL AND transaction_date >= ? AND transaction_date < ?`,
        [categoryId, monthStart, monthEnd]
      );
      if (cancelled) return;
      const newTotal = (result?.total ?? 0) + amountValue;
      const pct = Math.round((newTotal / cat.budget_limit!) * 100);
      setPreview(
        pct >= 80
          ? {
              spent: formatMoney(newTotal),
              limit: formatMoney(cat.budget_limit!),
              percentage: pct,
            }
          : null
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [active, categoryId, amount, expenseCategories, db, formatMoney, date]);

  return preview;
}
