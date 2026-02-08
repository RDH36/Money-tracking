import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import type { Transaction, TransactionType, Category } from '@/types';

interface CreateTransactionParams {
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string | null;
  note: string | null;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  account_name: string | null;
  account_type: string | null;
  account_icon: string | null;
  linked_account_name: string | null;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useTransactions() {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsFetching(true);
      const result = await db.getAllAsync<TransactionWithCategory>(
        `SELECT t.*,
          c.name as category_name, c.icon as category_icon, c.color as category_color,
          a.name as account_name, a.type as account_type, a.icon as account_icon,
          la.name as linked_account_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN transactions lt ON lt.transfer_id = t.transfer_id AND lt.id != t.id AND lt.deleted_at IS NULL
         LEFT JOIN accounts la ON la.id = lt.account_id
         WHERE t.deleted_at IS NULL
           AND NOT (t.transfer_id IS NOT NULL AND t.type = 'income')
         ORDER BY t.created_at DESC`
      );
      setTransactions(result);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsFetching(false);
    }
  }, [db]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async ({ type, amount, categoryId, accountId, note }: CreateTransactionParams): Promise<{ success: boolean; id: string | null; error?: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        // For expense transactions, check if account has sufficient balance
        if (type === 'expense' && accountId) {
          const accountResult = await db.getFirstAsync<{
            initial_balance: number;
            total_income: number;
            total_expense: number;
          }>(
            `SELECT
              a.initial_balance,
              COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
              COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
            FROM accounts a
            LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
            WHERE a.id = ? AND a.deleted_at IS NULL
            GROUP BY a.id`,
            [accountId]
          );

          if (!accountResult) {
            return { success: false, id: null, error: 'errors.accountNotFound' };
          }

          const currentBalance = accountResult.initial_balance + accountResult.total_income - accountResult.total_expense;
          if (currentBalance < amount) {
            return { success: false, id: null, error: 'errors.insufficientBalance' };
          }
        }

        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category_id, account_id, note, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [id, type, amount, categoryId, accountId, note, now, now]
        );

        await fetchTransactions();
        return { success: true, id };
      } catch (err) {
        console.error('Error creating transaction:', err);
        setError('errors.saveFailed');
        return { success: false, id: null, error: 'errors.saveFailed' };
      } finally {
        setIsLoading(false);
      }
    },
    [db, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      try {
        const now = new Date().toISOString();
        await db.runAsync(
          'UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?',
          [now, now, id]
        );
        await fetchTransactions();
        return true;
      } catch (err) {
        console.error('Error deleting transaction:', err);
        return false;
      }
    },
    [db, fetchTransactions]
  );

  return {
    transactions,
    createTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
    isLoading,
    isFetching,
    error,
  };
}
