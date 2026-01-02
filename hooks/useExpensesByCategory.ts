import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';

interface CategoryExpense {
  name: string;
  amount: number;
  color: string;
}

export function useExpensesByCategory() {
  const db = useSQLiteContext();
  const [expenses, setExpenses] = useState<CategoryExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<{
        category_name: string | null;
        category_color: string | null;
        total: number;
      }>(
        `SELECT
          c.name as category_name,
          c.color as category_color,
          SUM(t.amount) as total
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' AND t.deleted_at IS NULL
        GROUP BY t.category_id
        ORDER BY total DESC`
      );

      setExpenses(
        result.map((row) => ({
          name: row.category_name || 'Sans catégorie',
          amount: row.total,
          color: row.category_color || '#95A5A6',
        }))
      );
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    isLoading,
    refresh: fetchExpenses,
  };
}
