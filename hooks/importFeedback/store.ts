import { create } from 'zustand';

/**
 * État du programme « Testeur bêta » de l'import. Lu directement en base
 * (table `settings`) par useImportFeedback, jamais via settingsStore
 * (double hydratation), comme stores/premiumStore.
 */
interface ImportFeedbackState {
  loaded: boolean;
  /** Horodatage de l'avis envoyé (« Testeur bêta ✓ »). */
  rewardedAt: string | null;
  laterAt: string | null;
  firstReadAt: string | null;
  set: (patch: Partial<Omit<ImportFeedbackState, 'set'>>) => void;
}

export const useImportFeedbackStore = create<ImportFeedbackState>((set) => ({
  loaded: false,
  rewardedAt: null,
  laterAt: null,
  firstReadAt: null,
  set: (patch) => set(patch),
}));
