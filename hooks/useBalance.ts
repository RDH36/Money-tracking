import { useEffect, useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';

export function useBalance() {
  const db = useSQLiteContext();
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadBalance = useCallback(async () => {
    try {
      setIsLoading(true);

      const accountsResult = await db.getFirstAsync<{ total_initial: number }>(
        `SELECT COALESCE(SUM(initial_balance), 0) as total_initial
         FROM accounts
         WHERE deleted_at IS NULL`
      );
      const totalInitial = accountsResult?.total_initial || 0;

      const result = await db.getFirstAsync<{
        total_income: number;
        total_expense: number;
      }>(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
        FROM transactions
        WHERE deleted_at IS NULL`
      );

      const income = result?.total_income || 0;
      const expense = result?.total_expense || 0;
      const currentBalance = totalInitial + income - expense;

      setTotalIncome(income);
      setTotalExpense(expense);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const formatMoney = (amount: number) => {
    const mga = amount / 100;
    return mga.toLocaleString('fr-FR') + ' MGA';
  };

  return {
    balance,
    totalIncome,
    totalExpense,
    isLoading,
    refresh: loadBalance,
    formatted: formatMoney(balance),
    formattedIncome: formatMoney(totalIncome),
    formattedExpense: formatMoney(totalExpense),
  };
}
