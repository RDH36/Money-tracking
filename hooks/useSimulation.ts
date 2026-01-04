import { useState, useCallback, useMemo } from 'react';
import { useBalance, useCategories } from '@/hooks';
import type { SimulatedExpense, Category } from '@/types';

function generateId(): string {
  return 'sim-' + Math.random().toString(36).substr(2, 9);
}

export function useSimulation() {
  const { balance } = useBalance();
  const { categories } = useCategories();
  const [simulatedExpenses, setSimulatedExpenses] = useState<SimulatedExpense[]>([]);

  const totalSimulated = useMemo(() => {
    return simulatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [simulatedExpenses]);

  const projectedBalance = useMemo(() => {
    return balance - totalSimulated;
  }, [balance, totalSimulated]);

  const addSimulatedExpense = useCallback(
    (amount: number, categoryId: string | null, note: string | null) => {
      const category = categories.find((c) => c.id === categoryId);

      const newExpense: SimulatedExpense = {
        id: generateId(),
        amount,
        category_id: categoryId,
        category_name: category?.name || null,
        category_icon: category?.icon || null,
        category_color: category?.color || null,
        note,
      };

      setSimulatedExpenses((prev) => [...prev, newExpense]);
      return newExpense.id;
    },
    [categories]
  );

  const removeSimulatedExpense = useCallback((id: string) => {
    setSimulatedExpenses((prev) => prev.filter((exp) => exp.id !== id));
  }, []);

  const clearAllSimulations = useCallback(() => {
    setSimulatedExpenses([]);
  }, []);

  const simulatedByCategory = useMemo(() => {
    const grouped: Record<string, { name: string; color: string; amount: number }> = {};

    simulatedExpenses.forEach((exp) => {
      const key = exp.category_id || 'other';
      if (!grouped[key]) {
        grouped[key] = {
          name: exp.category_name || 'Autre',
          color: exp.category_color || '#94A3B8',
          amount: 0,
        };
      }
      grouped[key].amount += exp.amount;
    });

    return Object.values(grouped);
  }, [simulatedExpenses]);

  return {
    simulatedExpenses,
    totalSimulated,
    projectedBalance,
    currentBalance: balance,
    addSimulatedExpense,
    removeSimulatedExpense,
    clearAllSimulations,
    simulatedByCategory,
    hasSimulations: simulatedExpenses.length > 0,
  };
}
