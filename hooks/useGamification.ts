import { useCallback, useEffect } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { GamificationData } from '@/stores/gamificationStore';
import {
  BADGES,
  DAILY_CHALLENGE_TYPES,
  XP_VALUES,
  calculateLevel,
  type DailyChallengeType,
} from '@/constants/badges';
import { evaluateBadgeConditions } from '@/lib/gamification/badgeConditions';
import { BADGE_UNLOCKS, UNLOCK_KEYS } from '@/lib/gamification/unlocks';
import { useUnlocksStore } from '@/stores/unlocksStore';
import {
  validateActiveDailyChallenge,
  validateRetroactiveDailyChallenge,
} from '@/lib/gamification/dailyChallengeCheck';
import {
  scheduleStreakReminder,
  scheduleDailyChallengeReminder,
  cancelDailyChallengeReminder,
  scheduleWeeklySummary,
} from '@/lib/notifications';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getToday(): string {
  return formatLocalDate(new Date());
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDate(d);
}

interface GamificationRow {
  key: string;
  value: string;
}

export function useGamification() {
  const db = useSQLiteContext();
  const store = useGamificationStore();
  const getState = useGamificationStore.getState;
  const posthog = usePostHog();

  // Load from DB on mount
  useEffect(() => {
    if (store.isInitialized) return;

    const load = async () => {
      try {
        const rows = await db.getAllAsync<GamificationRow>(
          'SELECT key, value FROM gamification'
        );
        const map: Record<string, string> = {};
        rows.forEach((r) => { map[r.key] = r.value; });

        const badgeRows = await db.getAllAsync<{ badge_type: string }>(
          'SELECT badge_type FROM badges'
        );

        const data: GamificationData = {
          currentStreak: parseInt(map.current_streak || '0', 10),
          longestStreak: parseInt(map.longest_streak || '0', 10),
          lastActivityDate: map.last_activity_date || '',
          totalXP: parseInt(map.total_xp || '0', 10),
          streakFreezeAvailable: parseInt(map.streak_freeze_available || '1', 10),
          streakFreezeUsedDate: map.streak_freeze_used_date || '',
          dailyChallengeDate: map.daily_challenge_date || '',
          dailyChallengeType: map.daily_challenge_type || '',
          dailyChallengeCompleted: map.daily_challenge_completed === '1',
          weeklyChallengeStart: map.weekly_challenge_start || '',
          weeklyChallengeType: map.weekly_challenge_type || '',
          weeklyChallengeCompleted: map.weekly_challenge_completed === '1',
          monthlyChallengeMonth: map.monthly_challenge_month || '',
          monthlyChallengeType: map.monthly_challenge_type || '',
          monthlyChallengeCompleted: map.monthly_challenge_completed === '1',
          badges: badgeRows.map((b) => b.badge_type),
        };

        store.initialize(data);
      } catch (error) {
        console.error('Error loading gamification:', error);
      }
    };

    load();
  }, [db, store.isInitialized]);

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

  const awardXP = useCallback(
    async (amount: number) => {
      const currentXP = getState().totalXP;
      const newXP = currentXP + amount;
      const oldLevel = calculateLevel(currentXP);
      const newLevel = calculateLevel(newXP);

      store.setTotalXP(newXP);
      await saveValue('total_xp', String(newXP));

      if (newLevel > oldLevel) {
        store.setPendingLevelUp(newLevel);
      }

      return { xpGained: amount, newLevel: newLevel > oldLevel ? newLevel : null };
    },
    [saveValue, getState, store.setTotalXP, store.setPendingLevelUp]
  );

  const recordActivity = useCallback(async () => {
    const today = getToday();
    const yesterday = getYesterday();
    const s = getState();
    const last = s.lastActivityDate;

    if (last === today) return { xpGained: 0, newLevel: null, streakChanged: false };

    let newStreak = s.currentStreak;

    if (last === yesterday) {
      newStreak = s.currentStreak + 1;
      posthog.capture('streak_continued', { days: newStreak });
    } else if (last && last < yesterday) {
      if (s.streakFreezeAvailable > 0 && s.currentStreak > 0) {
        store.setStreakFreezeAvailable(s.streakFreezeAvailable - 1);
        store.setStreakFreezeUsedDate(today);
        await saveValue('streak_freeze_available', String(s.streakFreezeAvailable - 1));
        await saveValue('streak_freeze_used_date', today);
      } else {
        newStreak = 1;
        // Série cassée après une vraie séquence : signal de churn clé pour la rétention.
        if (s.currentStreak > 1) posthog.capture('streak_broken', { previous_days: s.currentStreak });
      }
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(s.longestStreak, newStreak);

    store.setCurrentStreak(newStreak);
    store.setLongestStreak(newLongest);
    store.setLastActivityDate(today);

    await saveValue('current_streak', String(newStreak));
    await saveValue('longest_streak', String(newLongest));
    await saveValue('last_activity_date', today);

    // Award XP for daily open
    const result = await awardXP(XP_VALUES.OPEN_APP);

    // Streak milestone bonuses
    if (newStreak === 7) await awardXP(XP_VALUES.STREAK_7);
    if (newStreak === 30) await awardXP(XP_VALUES.STREAK_30);

    return { ...result, streakChanged: true };
  }, [getState, store, saveValue, awardXP]);

  const generateDailyChallenge = useCallback(async () => {
    const today = getToday();
    const s = getState();
    if (s.dailyChallengeDate === today) return;

    // Retroactive validation of yesterday's challenge (save_today / stay_under_budget)
    if (s.dailyChallengeDate && !s.dailyChallengeCompleted && s.dailyChallengeType) {
      const wasValid = await validateRetroactiveDailyChallenge(
        db,
        s.dailyChallengeType as DailyChallengeType,
        s.dailyChallengeDate
      );
      if (wasValid) {
        await awardXP(XP_VALUES.DAILY_CHALLENGE);
      }
    }

    const index = Math.floor(Math.random() * DAILY_CHALLENGE_TYPES.length);
    const type = DAILY_CHALLENGE_TYPES[index];

    store.setDailyChallenge(today, type, false);
    await saveValue('daily_challenge_date', today);
    await saveValue('daily_challenge_type', type);
    await saveValue('daily_challenge_completed', '0');
  }, [db, getState, store.setDailyChallenge, saveValue, awardXP]);

  const completeDailyChallenge = useCallback(async () => {
    if (getState().dailyChallengeCompleted) return null;

    store.setDailyChallengeCompleted(true);
    await saveValue('daily_challenge_completed', '1');
    posthog.capture('challenge_completed', { scope: 'daily', challenge_type: getState().dailyChallengeType });
    return awardXP(XP_VALUES.DAILY_CHALLENGE);
  }, [getState, store.setDailyChallengeCompleted, saveValue, awardXP]);

  const checkDailyChallenge = useCallback(
    async (type: DailyChallengeType): Promise<number> => {
      const s = getState();
      if (s.dailyChallengeCompleted) return 0;
      if (s.dailyChallengeType !== type) return 0;

      const result = await completeDailyChallenge();
      return result?.xpGained ?? 0;
    },
    [getState, completeDailyChallenge]
  );

  /**
   * Validate the current daily challenge against live DB state.
   * Use after events that could satisfy conditions not tied to a single action
   * (e.g. log_before_noon, categorize_all).
   */
  const tryCompleteDailyChallenge = useCallback(async (): Promise<number> => {
    const s = getState();
    if (s.dailyChallengeCompleted) return 0;
    if (!s.dailyChallengeType) return 0;

    const ok = await validateActiveDailyChallenge(
      db,
      s.dailyChallengeType as DailyChallengeType
    );
    if (!ok) return 0;

    const result = await completeDailyChallenge();
    return result?.xpGained ?? 0;
  }, [db, getState, completeDailyChallenge]);

  const checkBadges = useCallback(async () => {
    const s = getState();
    const earned = s.badges;
    const newBadges: string[] = [];

    const conditions = await evaluateBadgeConditions(db, {
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      totalXP: s.totalXP,
    });

    const unlocksStore = useUnlocksStore.getState();
    const currentUnlocks = unlocksStore.unlocks;

    for (const badge of BADGES) {
      if (earned.includes(badge.id)) continue;
      if (!conditions[badge.id]) continue;

      newBadges.push(badge.id);
      store.addBadge(badge.id);
      posthog.capture('badge_unlocked', { badge_id: badge.id });

      const now = new Date().toISOString();
      await db.runAsync(
        'INSERT OR IGNORE INTO badges (id, badge_type, earned_at) VALUES (?, ?, ?)',
        [badge.id, badge.id, now]
      );

      // Trigger unlocks associated with this badge
      const unlockKeys = BADGE_UNLOCKS[badge.id];
      if (unlockKeys) {
        for (const key of unlockKeys) {
          if (currentUnlocks.has(key)) continue;
          await db.runAsync(
            `INSERT OR IGNORE INTO unlocks (key, unlocked_at, source) VALUES (?, ?, ?)`,
            [key, now, `badge:${badge.id}`]
          );
          unlocksStore.addUnlock(key);

          // Streak freeze unlocks grant immediate +1 freeze to the user
          if (
            key === UNLOCK_KEYS.STREAK_FREEZE_PLUS_1 ||
            key === UNLOCK_KEYS.STREAK_FREEZE_PLUS_2
          ) {
            const next = getState().streakFreezeAvailable + 1;
            store.setStreakFreezeAvailable(next);
            await saveValue('streak_freeze_available', String(next));
          }
        }
      }
    }

    return newBadges;
  }, [db, getState, store.addBadge]);

  const useStreakFreeze = useCallback(async () => {
    const freezes = getState().streakFreezeAvailable;
    if (freezes <= 0) return false;

    const today = getToday();
    store.setStreakFreezeAvailable(freezes - 1);
    store.setStreakFreezeUsedDate(today);
    await saveValue('streak_freeze_available', String(freezes - 1));
    await saveValue('streak_freeze_used_date', today);
    return true;
  }, [getState, store.setStreakFreezeAvailable, store.setStreakFreezeUsedDate, saveValue]);

  const getLevelUp = useCallback(() => {
    const level = getState().pendingLevelUp;
    if (level) store.setPendingLevelUp(null);
    return level;
  }, [getState, store.setPendingLevelUp]);

  const scheduleNotifications = useCallback(
    async (messages: {
      streakTitle: string; streakBody: string;
      challengeTitle: string; challengeBody: string;
      weeklyTitle: string; weeklyBody: string;
    }) => {
      const s = getState();
      if (s.currentStreak > 0) {
        await scheduleStreakReminder(messages.streakTitle, messages.streakBody);
      }
      if (!s.dailyChallengeCompleted) {
        await scheduleDailyChallengeReminder(messages.challengeTitle, messages.challengeBody);
      } else {
        await cancelDailyChallengeReminder();
      }
      await scheduleWeeklySummary(messages.weeklyTitle, messages.weeklyBody);
    },
    [getState]
  );

  return {
    currentStreak: store.currentStreak,
    longestStreak: store.longestStreak,
    lastActivityDate: store.lastActivityDate,
    totalXP: store.totalXP,
    currentLevel: calculateLevel(store.totalXP),
    streakFreezeAvailable: store.streakFreezeAvailable,
    dailyChallengeType: store.dailyChallengeType as DailyChallengeType | '',
    dailyChallengeCompleted: store.dailyChallengeCompleted,
    badges: store.badges,
    isLoading: !store.isInitialized,
    recordActivity,
    awardXP,
    checkDailyChallenge,
    tryCompleteDailyChallenge,
    generateDailyChallenge,
    completeDailyChallenge,
    checkBadges,
    useStreakFreeze,
    getLevelUp,
    scheduleNotifications,
  };
}
