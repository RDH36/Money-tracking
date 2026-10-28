import { create } from 'zustand';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

/**
 * Transaction en cours de modification. Les listes (historique, accueil)
 * appellent `open(tx)` ; une seule feuille de modification, montée à la
 * racine (`app/_layout.tsx`), l'affiche.
 */
interface TransactionEditState {
  target: TransactionWithCategory | null;
  open: (tx: TransactionWithCategory) => void;
  close: () => void;
}

export const useTransactionEditStore = create<TransactionEditState>((set) => ({
  target: null,
  open: (tx) => set({ target: tx }),
  close: () => set({ target: null }),
}));
