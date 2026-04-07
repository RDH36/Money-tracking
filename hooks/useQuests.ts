import { useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useQuestsStore } from '@/stores/questsStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useUnlocksStore } from '@/stores/unlocksStore';
import {
  QUESTS,
  TIER_1_QUESTS,
  computeQuestMetrics,
  countCompletedSteps,
  type QuestDefinition,
} from '@/lib/gamification/quests';
import { scheduleQuestProgressReminder } from '@/lib/notifications';
import { useTranslation } from 'react-i18next';
import { useGamification } from './useGamification';

interface QuestRow {
  id: string;
  current_step: number;
  completed_at: string | null;
}

export function useQuests() {
  const db = useSQLiteContext();
  const store = useQuestsStore();
  const gamificationInitialized = useGamificationStore((s) => s.isInitialized);
  const { awardXP } = useGamification();
  const { t } = useTranslation();

  // Load quest progress from DB
  useEffect(() => {
    if (store.isInitialized) return;
    if (!gamificationInitialized) return;

    const defaultProgress = () =>
      QUESTS.map((q) => ({
        id: q.id,
        currentStep: 0,
        completedAt: null as string | null,
        metricValue: 0,
      }));

    const load = async () => {
      try {
        // Defensive: create table if missing (handles rare race with V21 migration)
        await db.execAsync(
          `CREATE TABLE IF NOT EXISTS quests (
             id TEXT PRIMARY KEY,
             current_step INTEGER NOT NULL DEFAULT 0,
             completed_at TEXT,
             updated_at TEXT NOT NULL
           );`
        );
        const rows = await db.getAllAsync<QuestRow>(
          'SELECT id, current_step, completed_at FROM quests'
        );
        const map = new Map(rows.map((r) => [r.id, r]));

        const progress = QUESTS.map((q) => ({
          id: q.id,
          currentStep: map.get(q.id)?.current_step ?? 0,
          completedAt: map.get(q.id)?.completed_at ?? null,
          metricValue: 0,
        }));
        store.initialize(progress);
      } catch (err) {
        console.error('Error loading quests (falling back to defaults):', err);
        store.initialize(defaultProgress());
      }
    };
    load();
  }, [db, store.isInitialized, gamificationInitialized]);

  /**
   * Recompute all quest metrics from DB and advance any quest whose next step
   * target has been reached. Awards XP + triggers unlocks on newly-completed steps.
   * Returns total XP awarded during this refresh.
   */
  const refreshQuests = useCallback(async (): Promise<number> => {
    // CRITICAL: read all state via getState() to avoid stale-closure XP spam
    // when callers (e.g. useFocusEffect with empty deps) hold a stale reference.
    const questsStoreApi = useQuestsStore.getState();
    if (!questsStoreApi.isInitialized) return 0;

    // Authoritative source for prev steps: read directly from DB so we never
    // rely on possibly-stale in-memory state. This eliminates double-rewarding.
    const dbRows = await db.getAllAsync<QuestRow>(
      'SELECT id, current_step, completed_at FROM quests'
    );
    const dbProgress = new Map(dbRows.map((r) => [r.id, r]));

    const gState = useGamificationStore.getState();
    const metrics = await computeQuestMetrics(db, {
      longestStreak: gState.longestStreak,
      badgesCount: gState.badges.length,
      currentLevel: 0, // unused for now
      totalXP: gState.totalXP,
    });

    let xpGained = 0;
    const now = new Date().toISOString();
    const unlocksStore = useUnlocksStore.getState();

    for (const quest of QUESTS) {
      const value = metrics[quest.id] ?? 0;
      const completedSteps = countCompletedSteps(quest, value);
      const prevStep = dbProgress.get(quest.id)?.current_step ?? 0;

      if (completedSteps > prevStep) {
        // Persist the new step FIRST (idempotent guard) so any concurrent
        // refresh sees the updated value before we award XP.
        const completedAt =
          completedSteps >= quest.steps.length ? now : null;
        await db.runAsync(
          `INSERT INTO quests (id, current_step, completed_at, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             current_step = ?, completed_at = ?, updated_at = ?
           WHERE quests.current_step < ?`,
          [
            quest.id, completedSteps, completedAt, now,
            completedSteps, completedAt, now,
            completedSteps,
          ]
        );

        // Re-read the row to confirm we won the race and our step is the latest.
        const confirmRow = await db.getFirstAsync<QuestRow>(
          'SELECT id, current_step, completed_at FROM quests WHERE id = ?',
          [quest.id]
        );
        const persistedStep = confirmRow?.current_step ?? 0;

        // Only award XP for steps we actually persisted (between prevStep and persistedStep).
        for (let i = prevStep; i < persistedStep; i++) {
          const step = quest.steps[i];
          await awardXP(step.xp);
          xpGained += step.xp;

          // Trigger unlock if defined for this step
          if (step.unlock && !unlocksStore.unlocks.has(step.unlock)) {
            await db.runAsync(
              `INSERT OR IGNORE INTO unlocks (key, unlocked_at, source) VALUES (?, ?, ?)`,
              [step.unlock, now, `quest:${quest.id}`]
            );
            unlocksStore.addUnlock(step.unlock);
          }
        }

        questsStoreApi.setQuest({
          id: quest.id,
          currentStep: persistedStep,
          completedAt: confirmRow?.completed_at ?? null,
          metricValue: value,
        });
      } else {
        // No step crossed — just refresh displayed metric value
        const prev = questsStoreApi.quests[quest.id];
        if (!prev || prev.metricValue !== value || prev.currentStep !== prevStep) {
          questsStoreApi.setQuest({
            id: quest.id,
            currentStep: prevStep,
            completedAt: dbProgress.get(quest.id)?.completed_at ?? null,
            metricValue: value,
          });
        }
      }
    }

    // Endgame: award quest_master badge when all Tier 1 quests are complete
    const allTier1Complete = TIER_1_QUESTS.every((q) => {
      const value = metrics[q.id] ?? 0;
      return countCompletedSteps(q, value) >= q.steps.length;
    });
    if (allTier1Complete) {
      const gamifState = useGamificationStore.getState();
      if (!gamifState.badges.includes('quest_master')) {
        const nowIso = new Date().toISOString();
        await db.runAsync(
          'INSERT OR IGNORE INTO badges (id, badge_type, earned_at) VALUES (?, ?, ?)',
          ['quest_master', 'quest_master', nowIso]
        );
        gamifState.addBadge('quest_master');
        await awardXP(2000);
        xpGained += 2000;
      }
    }

    // Schedule a progress reminder for the quest closest to its next step (≥70%)
    let bestQuest: { quest: QuestDefinition; progress: number; remaining: number } | null = null;
    for (const quest of QUESTS) {
      const value = metrics[quest.id] ?? 0;
      const completedSteps = countCompletedSteps(quest, value);
      if (completedSteps >= quest.steps.length) continue;
      const step = quest.steps[completedSteps];
      const prevTarget = completedSteps > 0 ? quest.steps[completedSteps - 1].target : 0;
      const range = step.target - prevTarget;
      if (range <= 0) continue;
      const progress = (value - prevTarget) / range;
      if (progress < 0.7) continue;
      if (!bestQuest || progress > bestQuest.progress) {
        bestQuest = { quest, progress, remaining: step.target - value };
      }
    }
    if (bestQuest) {
      const title = t('gamification.notifQuestTitle', { quest: t(bestQuest.quest.titleKey) });
      const body = t('gamification.notifQuestBody', { remaining: bestQuest.remaining });
      scheduleQuestProgressReminder(title, body).catch(() => {});
    }

    return xpGained;
  }, [db, awardXP, t]);

  /** Get quest definition + current progress merged for UI. */
  const getQuestWithProgress = useCallback(
    (quest: QuestDefinition) => {
      const progress = store.quests[quest.id];
      const currentStep = progress?.currentStep ?? 0;
      const metricValue = progress?.metricValue ?? 0;
      const isCompleted = currentStep >= quest.steps.length;
      const nextStep = isCompleted ? null : quest.steps[currentStep];
      const prevTarget = currentStep > 0 ? quest.steps[currentStep - 1].target : 0;
      const stepProgress = nextStep
        ? Math.min(
            Math.max((metricValue - prevTarget) / (nextStep.target - prevTarget), 0),
            1
          )
        : 1;
      return { currentStep, metricValue, isCompleted, nextStep, stepProgress };
    },
    [store.quests]
  );

  return {
    isLoading: !store.isInitialized,
    quests: QUESTS,
    questProgress: store.quests,
    refreshQuests,
    getQuestWithProgress,
  };
}
