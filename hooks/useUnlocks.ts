import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useUnlocksStore } from '@/stores/unlocksStore';
import {
  BADGE_UNLOCKS,
  getCategorySlotBonus,
  getAccountSlotBonus,
  getStreakFreezeBonus,
  type UnlockKey,
} from '@/lib/gamification/unlocks';
import { MAX_CUSTOM_CATEGORIES, MAX_CUSTOM_ACCOUNTS } from '@/lib/database/schema';

interface UnlockRow {
  key: string;
}

export function useUnlocks() {
  const db = useSQLiteContext();
  const store = useUnlocksStore();
  const getState = useUnlocksStore.getState;

  useEffect(() => {
    if (store.isInitialized) return;

    const load = async () => {
      try {
        const rows = await db.getAllAsync<UnlockRow>('SELECT key FROM unlocks');
        store.initialize(rows.map((r) => r.key));
      } catch (error) {
        console.error('Error loading unlocks:', error);
        store.initialize([]);
      }
    };

    load();
  }, [db, store.isInitialized]);

  const unlock = useCallback(
    async (key: UnlockKey | string, source?: string) => {
      if (getState().unlocks.has(key)) return false;
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO unlocks (key, unlocked_at, source) VALUES (?, ?, ?)`,
        [key, now, source ?? null]
      );
      store.addUnlock(key);
      return true;
    },
    [db, getState, store.addUnlock]
  );

  const unlockFromBadge = useCallback(
    async (badgeId: string): Promise<string[]> => {
      const keys = BADGE_UNLOCKS[badgeId];
      if (!keys) return [];
      const newly: string[] = [];
      for (const k of keys) {
        const wasNew = await unlock(k, `badge:${badgeId}`);
        if (wasNew) newly.push(k);
      }
      return newly;
    },
    [unlock]
  );

  const isUnlocked = useCallback(
    (key: UnlockKey | string) => getState().unlocks.has(key),
    [getState]
  );

  const unlocks = store.unlocks;

  return {
    isLoading: !store.isInitialized,
    unlocks,
    isUnlocked,
    unlock,
    unlockFromBadge,
    consumePendingUnlocks: store.consumePendingUnlocks,
    // Computed limits
    maxCustomCategories: MAX_CUSTOM_CATEGORIES + getCategorySlotBonus(unlocks),
    maxCustomAccounts: MAX_CUSTOM_ACCOUNTS + getAccountSlotBonus(unlocks),
    maxStreakFreezes: 1 + getStreakFreezeBonus(unlocks),
  };
}
