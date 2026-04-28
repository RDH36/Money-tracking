import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { useGamification } from './useGamification';
import type { useWeeklyChallenge } from './useWeeklyChallenge';
import type { useMonthlyChallenge } from './useMonthlyChallenge';
import type { useQuests } from './useQuests';

interface Params {
  refreshAccounts: () => void | Promise<void>;
  refreshTransactions: () => void | Promise<void>;
  refreshBudgets: () => void | Promise<void>;
  checkNew: () => void | Promise<void>;
  gamification: ReturnType<typeof useGamification>;
  weekly: ReturnType<typeof useWeeklyChallenge>;
  monthly: ReturnType<typeof useMonthlyChallenge>;
  quests: ReturnType<typeof useQuests>;
  onUnlocks: (keys: string[]) => void;
  onLevelUp: (level: number) => void;
}

export function useDashboardFocus({
  refreshAccounts,
  refreshTransactions,
  refreshBudgets,
  checkNew,
  gamification,
  weekly,
  monthly,
  quests,
  onUnlocks,
  onLevelUp,
}: Params) {
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshTransactions();
      refreshBudgets();
      checkNew();
      if (gamification.isLoading) return;

      gamification.generateDailyChallenge();
      weekly.generateWeeklyChallenge().then(() => weekly.refreshProgress());
      monthly.generateMonthlyChallenge().then(() => monthly.refreshProgress());
      gamification.recordActivity().then(async () => {
        await gamification.checkBadges();
        await quests.refreshQuests();
        const pending = useUnlocksStore.getState().consumePendingUnlocks();
        if (pending.length > 0) onUnlocks(pending);
        const level = gamification.getLevelUp();
        if (level) onLevelUp(level);
        const streak = useGamificationStore.getState().currentStreak;
        gamification.scheduleNotifications({
          streakTitle: t('gamification.notifStreakTitle', { count: streak }),
          streakBody: t('gamification.notifStreakBody'),
          challengeTitle: t('gamification.notifChallengeTitle'),
          challengeBody: t('gamification.notifChallengeBody'),
          weeklyTitle: t('gamification.notifWeeklyTitle'),
          weeklyBody: t('gamification.notifWeeklyBody'),
        });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshAccounts, refreshTransactions, refreshBudgets, checkNew, gamification.isLoading])
  );
}
