import { create } from 'zustand';

/**
 * Cross-component refresh signal store.
 *
 * `useAccounts` and `useTransactions` use local React state, so each component
 * that calls them gets its own copy. When a mutation happens in one screen
 * (e.g. add transaction), other screens (dashboard, transactions list) need
 * to be told to refetch.
 *
 * Each version counter acts as a useEffect dependency. Bump it after a
 * mutation and every subscribed hook re-runs its fetch.
 */
interface DataRefreshState {
  accountsVersion: number;
  transactionsVersion: number;
  budgetsVersion: number;
  bumpAccounts: () => void;
  bumpTransactions: () => void;
  bumpBudgets: () => void;
  /** Bump everything at once (use after multi-table mutations like transactions). */
  bumpAll: () => void;
}

export const useDataRefreshStore = create<DataRefreshState>((set) => ({
  accountsVersion: 0,
  transactionsVersion: 0,
  budgetsVersion: 0,
  bumpAccounts: () => set((s) => ({ accountsVersion: s.accountsVersion + 1 })),
  bumpTransactions: () => set((s) => ({ transactionsVersion: s.transactionsVersion + 1 })),
  bumpBudgets: () => set((s) => ({ budgetsVersion: s.budgetsVersion + 1 })),
  bumpAll: () =>
    set((s) => ({
      accountsVersion: s.accountsVersion + 1,
      transactionsVersion: s.transactionsVersion + 1,
      budgetsVersion: s.budgetsVersion + 1,
    })),
}));
