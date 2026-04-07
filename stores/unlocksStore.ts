import { create } from 'zustand';

interface UnlocksState {
  unlocks: Set<string>;
  isInitialized: boolean;
  pendingUnlocks: string[];

  initialize: (keys: string[]) => void;
  addUnlock: (key: string) => void;
  consumePendingUnlocks: () => string[];
}

export const useUnlocksStore = create<UnlocksState>((set, get) => ({
  unlocks: new Set(),
  isInitialized: false,
  pendingUnlocks: [],

  initialize: (keys) => set({ unlocks: new Set(keys), isInitialized: true }),

  addUnlock: (key) => {
    const current = get().unlocks;
    if (current.has(key)) return;
    const next = new Set(current);
    next.add(key);
    set({
      unlocks: next,
      pendingUnlocks: [...get().pendingUnlocks, key],
    });
  },

  consumePendingUnlocks: () => {
    const pending = get().pendingUnlocks;
    if (pending.length === 0) return [];
    set({ pendingUnlocks: [] });
    return pending;
  },
}));

export const useIsUnlocked = (key: string) =>
  useUnlocksStore((s) => s.unlocks.has(key));

export const useAllUnlocks = () => useUnlocksStore((s) => s.unlocks);
