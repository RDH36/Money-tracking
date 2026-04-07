import type { SQLiteDatabase } from 'expo-sqlite';
import { UNLOCK_KEYS, type UnlockKey } from './unlocks';

export type QuestMetric =
  | 'longest_streak'
  | 'badges_count'
  | 'clean_budget_months'
  | 'completed_plans'
  | 'distinct_categories'
  | 'current_level'
  | 'total_xp';

export type QuestTier = 1 | 2;

export interface QuestStep {
  target: number;
  xp: number;
  unlock?: UnlockKey;
}

export interface QuestDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
  metric: QuestMetric;
  steps: QuestStep[];
  tier: QuestTier;
}

/**
 * 5 long-term quests. Each has 3 progressive steps.
 * Final step of the Collector unlocks the Prism theme.
 */
export const QUESTS: QuestDefinition[] = [
  // --- Tier 1 ---
  {
    id: 'marathon', tier: 1,
    titleKey: 'gamification.questMarathon',
    descriptionKey: 'gamification.questMarathonDesc',
    icon: 'flame', color: '#EF4444',
    metric: 'longest_streak',
    steps: [
      { target: 7, xp: 100 },
      { target: 30, xp: 500 },
      { target: 100, xp: 1500 },
    ],
  },
  {
    id: 'collector', tier: 1,
    titleKey: 'gamification.questCollector',
    descriptionKey: 'gamification.questCollectorDesc',
    icon: 'ribbon', color: '#A855F7',
    metric: 'badges_count',
    steps: [
      { target: 5, xp: 200 },
      { target: 15, xp: 500 },
      { target: 25, xp: 1000, unlock: UNLOCK_KEYS.THEME_PRISM },
    ],
  },
  {
    id: 'discipline', tier: 1,
    titleKey: 'gamification.questDiscipline',
    descriptionKey: 'gamification.questDisciplineDesc',
    icon: 'shield-checkmark', color: '#10B981',
    metric: 'clean_budget_months',
    steps: [
      { target: 1, xp: 300 },
      { target: 3, xp: 500 },
      { target: 6, xp: 1000 },
    ],
  },
  {
    id: 'architect', tier: 1,
    titleKey: 'gamification.questArchitect',
    descriptionKey: 'gamification.questArchitectDesc',
    icon: 'clipboard', color: '#8B5CF6',
    metric: 'completed_plans',
    steps: [
      { target: 3, xp: 150 },
      { target: 10, xp: 400 },
      { target: 25, xp: 800 },
    ],
  },
  {
    id: 'explorer', tier: 1,
    titleKey: 'gamification.questExplorer',
    descriptionKey: 'gamification.questExplorerDesc',
    icon: 'compass', color: '#06B6D4',
    metric: 'distinct_categories',
    steps: [
      { target: 5, xp: 100 },
      { target: 8, xp: 300 },
      { target: 12, xp: 500 },
    ],
  },
  // --- Tier 2 — Épiques ---
  {
    id: 'marathon_epic', tier: 2,
    titleKey: 'gamification.questMarathonEpic',
    descriptionKey: 'gamification.questMarathonEpicDesc',
    icon: 'flash', color: '#DC2626',
    metric: 'longest_streak',
    steps: [
      { target: 200, xp: 3000 },
      { target: 365, xp: 5000 },
      { target: 500, xp: 10000 },
    ],
  },
  {
    id: 'collector_epic', tier: 2,
    titleKey: 'gamification.questCollectorEpic',
    descriptionKey: 'gamification.questCollectorEpicDesc',
    icon: 'star', color: '#7E22CE',
    metric: 'badges_count',
    steps: [
      { target: 27, xp: 2000 },
      { target: 29, xp: 5000 },
      { target: 30, xp: 10000 },
    ],
  },
  {
    id: 'discipline_epic', tier: 2,
    titleKey: 'gamification.questDisciplineEpic',
    descriptionKey: 'gamification.questDisciplineEpicDesc',
    icon: 'shield', color: '#047857',
    metric: 'clean_budget_months',
    steps: [
      { target: 9, xp: 3000 },
      { target: 12, xp: 6000 },
      { target: 18, xp: 12000 },
    ],
  },
  {
    id: 'architect_epic', tier: 2,
    titleKey: 'gamification.questArchitectEpic',
    descriptionKey: 'gamification.questArchitectEpicDesc',
    icon: 'construct', color: '#6D28D9',
    metric: 'completed_plans',
    steps: [
      { target: 50, xp: 2500 },
      { target: 100, xp: 5000 },
      { target: 200, xp: 10000 },
    ],
  },
  {
    id: 'explorer_epic', tier: 2,
    titleKey: 'gamification.questExplorerEpic',
    descriptionKey: 'gamification.questExplorerEpicDesc',
    icon: 'telescope', color: '#0891B2',
    metric: 'total_xp',
    steps: [
      { target: 5000, xp: 1000 },
      { target: 15000, xp: 3000 },
      { target: 50000, xp: 8000 },
    ],
  },
];

/** Returns only Tier 1 quests. */
export const TIER_1_QUESTS = QUESTS.filter((q) => q.tier === 1);
/** Returns only Tier 2 quests. */
export const TIER_2_QUESTS = QUESTS.filter((q) => q.tier === 2);

interface QuestStateInput {
  longestStreak: number;
  badgesCount: number;
  currentLevel: number;
  totalXP: number;
}

/**
 * Compute the current raw metric value for each quest.
 * Returns a map of quest id → current numeric value.
 */
export async function computeQuestMetrics(
  db: SQLiteDatabase,
  state: QuestStateInput
): Promise<Record<string, number>> {
  const distinctCategoriesRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT category_id) as count FROM transactions
     WHERE deleted_at IS NULL AND category_id IS NOT NULL`
  );
  const completedPlansRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM planifications
     WHERE status = 'completed' AND deleted_at IS NULL`
  );
  const cleanMonths = await countCleanBudgetMonths(db, 12);

  const completedPlans = completedPlansRow?.count ?? 0;
  const distinctCategories = distinctCategoriesRow?.count ?? 0;

  return {
    // Tier 1
    marathon: state.longestStreak,
    collector: state.badgesCount,
    discipline: cleanMonths,
    architect: completedPlans,
    explorer: distinctCategories,
    // Tier 2 (reuse same underlying metrics)
    marathon_epic: state.longestStreak,
    collector_epic: state.badgesCount,
    discipline_epic: cleanMonths,
    architect_epic: completedPlans,
    explorer_epic: state.totalXP,
  };
}

/**
 * Counts consecutive most-recent complete months where no category exceeded its budget.
 * Mirrors the helper in badgeConditions.ts.
 */
async function countCleanBudgetMonths(
  db: SQLiteDatabase,
  maxLookback: number
): Promise<number> {
  let clean = 0;
  const now = new Date();
  for (let i = 1; i <= maxLookback; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const budgets = await db.getAllAsync<{ category_id: string; budget_limit: number }>(
      'SELECT category_id, budget_limit FROM budget_history WHERE year_month = ?',
      [ym]
    );
    if (budgets.length === 0) break;

    let exceeded = false;
    for (const b of budgets) {
      const row = await db.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE deleted_at IS NULL AND type = 'expense'
           AND category_id = ? AND substr(created_at, 1, 7) = ?`,
        [b.category_id, ym]
      );
      if ((row?.total ?? 0) > b.budget_limit) {
        exceeded = true;
        break;
      }
    }
    if (exceeded) break;
    clean++;
  }
  return clean;
}

/**
 * Given a current metric value and a quest, return how many steps are completed.
 */
export function countCompletedSteps(quest: QuestDefinition, metricValue: number): number {
  let count = 0;
  for (const step of quest.steps) {
    if (metricValue >= step.target) count++;
    else break;
  }
  return count;
}
