import type { Cycle } from '@/lib/analysis/types';

interface TxLike {
  transaction_date: string;
  type: string;
  amount: number;
  transfer_id?: string | null;
}

/**
 * Entrées / sorties du cycle courant (virements exclus). Bornes ISO du
 * `Cycle` : `start` inclus, `end` exclu — même convention que les requêtes
 * du bilan.
 */
export function sumCycleTotals<T extends TxLike>(
  transactions: T[],
  cycle: Pick<Cycle, 'start' | 'end'>
): { monthIncome: number; monthExpense: number } {
  const startMs = new Date(cycle.start).getTime();
  const endMs = new Date(cycle.end).getTime();
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.transfer_id) continue;
    const at = new Date(tx.transaction_date).getTime();
    if (at < startMs || at >= endMs) continue;
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
  }
  return { monthIncome: income, monthExpense: expense };
}
