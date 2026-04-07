import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useGamificationStore } from '@/stores/gamificationStore';
import {
  WEEKLY_CHALLENGE_REWARDS,
  type WeeklyChallengeType,
} from '@/constants/badges';
import {
  getCurrentWeekStart,
  pickRandomWeeklyChallenge,
  computeWeeklyProgress,
} from '@/lib/gamification/weeklyChallenge';
import { useGamification } from './useGamification';

export function useWeeklyChallenge() {
  const db = useSQLiteContext();
  const store = useGamificationStore();
  const getState = useGamificationStore.getState;
  const { awardXP } = useGamification();

  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState(1);

  const saveValue = useCallback(
    async (key: string, value: string) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO gamification (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
        [key, value, now, value, now]
      );
    },
    [db]
  );

  /** Generate a new weekly challenge if the current week has rolled over. */
  const generateWeeklyChallenge = useCallback(async () => {
    const weekStart = getCurrentWeekStart();
    const s = getState();
    if (s.weeklyChallengeStart === weekStart) return;

    const type = pickRandomWeeklyChallenge();
    store.setWeeklyChallenge(weekStart, type, false);
    await saveValue('weekly_challenge_start', weekStart);
    await saveValue('weekly_challenge_type', type);
    await saveValue('weekly_challenge_completed', '0');
  }, [getState, store, saveValue]);

  /**
   * Re-compute progress from DB and mark complete if target reached.
   * Returns XP awarded (0 if not newly completed).
   */
  const refreshProgress = useCallback(async (): Promise<number> => {
    const s = getState();
    if (!s.weeklyChallengeType || !s.weeklyChallengeStart) {
      setProgress(0);
      setTarget(1);
      return 0;
    }

    const result = await computeWeeklyProgress(
      db,
      s.weeklyChallengeType as WeeklyChallengeType,
      s.weeklyChallengeStart
    );
    setProgress(result.progress);
    setTarget(result.target);

    if (!s.weeklyChallengeCompleted && result.progress >= result.target) {
      const reward = WEEKLY_CHALLENGE_REWARDS[s.weeklyChallengeType as WeeklyChallengeType] ?? 0;
      store.setWeeklyChallengeCompleted(true);
      await saveValue('weekly_challenge_completed', '1');
      await awardXP(reward);
      return reward;
    }
    return 0;
  }, [db, getState, store, saveValue, awardXP]);

  // Auto-refresh progress when challenge state changes
  useEffect(() => {
    if (!store.isInitialized) return;
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.isInitialized,
    store.weeklyChallengeType,
    store.weeklyChallengeStart,
    store.weeklyChallengeCompleted,
  ]);

  return {
    weeklyChallengeType: store.weeklyChallengeType as WeeklyChallengeType | '',
    weeklyChallengeStart: store.weeklyChallengeStart,
    weeklyChallengeCompleted: store.weeklyChallengeCompleted,
    progress,
    target,
    reward:
      (WEEKLY_CHALLENGE_REWARDS[
        store.weeklyChallengeType as WeeklyChallengeType
      ] as number | undefined) ?? 0,
    generateWeeklyChallenge,
    refreshProgress,
  };
}
