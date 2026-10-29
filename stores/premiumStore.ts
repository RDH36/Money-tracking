import { create } from 'zustand';
import type { LicenseCheck } from '@/lib/premium';

/**
 * État de Mitsitsy Plus. Lu directement en base (`settings.plus_license`) par
 * hooks/premium/usePremium, jamais via settingsStore (double hydratation).
 */
interface PremiumState {
  loaded: boolean;
  /** Résultat de la vérification du jeton stocké ; null = aucun jeton. */
  check: LicenseCheck | null;
  /** Jeton reçu par lien profond, en attente de confirmation. */
  pendingLink: string | null;
  setCheck: (check: LicenseCheck | null) => void;
  setPendingLink: (token: string | null) => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  loaded: false,
  check: null,
  pendingLink: null,
  setCheck: (check) => set({ check, loaded: true }),
  setPendingLink: (pendingLink) => set({ pendingLink }),
}));
