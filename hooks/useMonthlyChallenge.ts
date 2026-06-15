import { useCallback, useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import { useGamificationStore } from '@/stores/gamificationStore';
import {
  MONTHLY_CHALLENGE_REWARDS,
  type MonthlyChallengeType,
} from '@/constants/badges';
import {
  getCurrentMonth,
  pickRandomMonthlyChallenge,
  computeMonthlyProgress,
} from '@/lib/gamification/monthlyChallenge';
import { useGamification } from './useGamification';

export function useMonthlyChallenge() {
  const db = useSQLiteContext();
  const store = useGamificationStore();
  const getState = useGamificationStore.getState;
  const { awardXP } = useGamification();
  const posthog = usePostHog();

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

  /** Generate a new monthly challenge if the month has rolled over. */
  const generateMonthlyChallenge = useCallback(async () => {
    const month = getCurrentMonth();
    const s = getState();
    if (s.monthlyChallengeMonth === month) return;

    const type = pickRandomMonthlyChallenge();
    store.setMonthlyChallenge(month, type, false);
    await saveValue('monthly_challenge_month', month);
    await saveValue('monthly_challenge_type', type);
    await saveValue('monthly_challenge_completed', '0');
  }, [getState, store, saveValue]);

  /** Recompute progress and mark complete if target reached. */
  const refreshProgress = useCallback(async (): Promise<number> => {
    const s = getState();
    if (!s.monthlyChallengeType || !s.monthlyChallengeMonth) {
      setProgress(0);
      setTarget(1);
      return 0;
    }

    const result = await computeMonthlyProgress(
      db,
      s.monthlyChallengeType as MonthlyChallengeType,
      s.monthlyChallengeMonth
    );
    setProgress(result.progress);
    setTarget(result.target);

    const reached = result.progress >= result.target;

    if (!s.monthlyChallengeCompleted && reached) {
      const reward = MONTHLY_CHALLENGE_REWARDS[s.monthlyChallengeType as MonthlyChallengeType] ?? 0;
      store.setMonthlyChallengeCompleted(true);
      await saveValue('monthly_challenge_completed', '1');
      posthog.capture('challenge_completed', { scope: 'monthly', challenge_type: s.monthlyChallengeType });
      await awardXP(reward);
      return reward;
    }

    // Revoke completion when the condition no longer holds — e.g. the
    // "budget impeccable" challenge once a category goes over its limit.
    // The XP already granted is kept; only the completed status resets so the
    // challenge re-opens and reflects reality.
    if (s.monthlyChallengeCompleted && !reached) {
      store.setMonthlyChallengeCompleted(false);
      await saveValue('monthly_challenge_completed', '0');
    }
    return 0;
  }, [db, getState, store, saveValue, awardXP]);

  useEffect(() => {
    if (!store.isInitialized) return;
    refreshProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.isInitialized,
    store.monthlyChallengeType,
    store.monthlyChallengeMonth,
    store.monthlyChallengeCompleted,
  ]);

  return {
    monthlyChallengeType: store.monthlyChallengeType as MonthlyChallengeType | '',
    monthlyChallengeMonth: store.monthlyChallengeMonth,
    monthlyChallengeCompleted: store.monthlyChallengeCompleted,
    progress,
    target,
    reward:
      (MONTHLY_CHALLENGE_REWARDS[
        store.monthlyChallengeType as MonthlyChallengeType
      ] as number | undefined) ?? 0,
    generateMonthlyChallenge,
    refreshProgress,
  };
}
