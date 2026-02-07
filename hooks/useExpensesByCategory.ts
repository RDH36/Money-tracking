import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';

interface CategoryExpense {
  id: string | null;
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
        category_id: string | null;
        category_name: string | null;
        category_color: string | null;
        total: number;
      }>(
        `SELECT
          t.category_id as category_id,
          c.name as category_name,
          c.color as category_color,
          SUM(t.amount) as total
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.type = 'expense' AND t.deleted_at IS NULL AND t.transfer_id IS NULL
        GROUP BY t.category_id
        ORDER BY total DESC`
      );

      setExpenses(
        result.map((row) => ({
          id: row.category_id,
          name: row.category_name || '',
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
