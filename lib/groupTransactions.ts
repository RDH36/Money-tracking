import type { TransactionWithCategory } from '@/hooks/useTransactions';

export interface PlanificationGroup {
  kind: 'group';
  planificationId: string;
  title: string;
  transactions: TransactionWithCategory[];
  latestCreatedAt: string;
}
export interface SingleTransaction {
  kind: 'single';
  transaction: TransactionWithCategory;
}
export type GroupedTransactionItem = PlanificationGroup | SingleTransaction;

/**
 * Groups consecutive transactions that share a `planification_id` into a single
 * group entry. Transactions without a planification stay as standalone items.
 * Preserves the input order (so a sorted-by-date list keeps that order).
 */
export function groupByPlanification(
  transactions: TransactionWithCategory[]
): GroupedTransactionItem[] {
  const groups = new Map<string, PlanificationGroup>();
  const items: GroupedTransactionItem[] = [];
  for (const tx of transactions) {
    if (tx.planification_id) {
      let g = groups.get(tx.planification_id);
      if (!g) {
        g = {
          kind: 'group',
          planificationId: tx.planification_id,
          title: tx.planification_title || '',
          transactions: [],
          latestCreatedAt: tx.transaction_date,
        };
        groups.set(tx.planification_id, g);
        items.push(g);
      }
      g.transactions.push(tx);
      if (tx.transaction_date > g.latestCreatedAt) g.latestCreatedAt = tx.transaction_date;
    } else {
      items.push({ kind: 'single', transaction: tx });
    }
  }
  return items;
}
