import type { SQLiteDatabase } from 'expo-sqlite';
import { calculateLevel } from '@/constants/badges';

export interface BadgeInput {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
}

interface CountRow { count: number }

async function count(db: SQLiteDatabase, sql: string, params: any[] = []): Promise<number> {
  const row = await db.getFirstAsync<CountRow>(sql, params);
  return row?.count ?? 0;
}

/**
 * Evaluate all badge conditions against the current DB state.
 * Returns a map of badgeId → boolean (true = condition met).
 */
export async function evaluateBadgeConditions(
  db: SQLiteDatabase,
  state: BadgeInput
): Promise<Record<string, boolean>> {
  const { currentStreak, longestStreak, totalXP } = state;
  const level = calculateLevel(totalXP);

  const transactionCount = await count(
    db,
    'SELECT COUNT(*) as count FROM transactions WHERE deleted_at IS NULL'
  );

  // Early-bird / night-owl: distinct days with a transaction before 9am / after 22h
  const earlyBirdDays = await count(
    db,
    `SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as count
     FROM transactions
     WHERE deleted_at IS NULL
       AND CAST(substr(created_at, 12, 2) AS INTEGER) < 9`
  );
  const nightOwlDays = await count(
    db,
    `SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as count
     FROM transactions
     WHERE deleted_at IS NULL
       AND CAST(substr(created_at, 12, 2) AS INTEGER) >= 22`
  );

  // Distinct categories used in non-deleted transactions
  const distinctCategories = await count(
    db,
    `SELECT COUNT(DISTINCT category_id) as count
     FROM transactions
     WHERE deleted_at IS NULL AND category_id IS NOT NULL`
  );

  // Custom categories created by user (not default, not system, not deleted)
  const customCategories = await count(
    db,
    `SELECT COUNT(*) as count FROM categories
     WHERE is_default = 0 AND deleted_at IS NULL
       AND category_type NOT IN ('transfer', 'system')`
  );

  // Validated planifications (soft-delete aware)
  const validatedPlans = await count(
    db,
    `SELECT COUNT(*) as count FROM planifications
     WHERE status = 'completed' AND deleted_at IS NULL`
  );

  // Themes tried (stored in settings as CSV, e.g. "turquoise,blue")
  const themesRow = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'themes_tried'`
  );
  const themesTriedCount = themesRow?.value
    ? themesRow.value.split(',').filter(Boolean).length
    : 0;

  // Weekend warrior: 4 weekends with at least one activity on Sat or Sun
  // Pragmatic check: distinct ISO weeks where at least one transaction falls on weekend.
  const weekendActivity = await count(
    db,
    `SELECT COUNT(DISTINCT strftime('%Y-%W', created_at)) as count
     FROM transactions
     WHERE deleted_at IS NULL
       AND CAST(strftime('%w', created_at) AS INTEGER) IN (0, 6)`
  );

  // Budget respect history (last N complete months) — see helper below
  const budgetCleanMonths = await countCleanBudgetMonths(db, 6);

  return {
    // Existing
    first_expense: transactionCount >= 1,
    streak_3: currentStreak >= 3 || longestStreak >= 3,
    streak_7: currentStreak >= 7 || longestStreak >= 7,
    streak_30: currentStreak >= 30 || longestStreak >= 30,
    xp_500: totalXP >= 500,
    level_5: level >= 5,
    transactions_50: transactionCount >= 50,
    // New — regularity
    streak_14: currentStreak >= 14 || longestStreak >= 14,
    streak_60: currentStreak >= 60 || longestStreak >= 60,
    streak_100: currentStreak >= 100 || longestStreak >= 100,
    early_bird: earlyBirdDays >= 7,
    night_owl: nightOwlDays >= 7,
    weekend_warrior: weekendActivity >= 4,
    // New — financial mastery
    budget_keeper: budgetCleanMonths >= 1,
    budget_master: budgetCleanMonths >= 3,
    budget_legend: budgetCleanMonths >= 6,
    saver: await hasPositiveCurrentMonth(db),
    planner: validatedPlans >= 5,
    master_planner: validatedPlans >= 20,
    // New — exploration
    category_explorer: distinctCategories >= 8,
    theme_switcher: themesTriedCount >= 4,
    first_custom: customCategories >= 1,
    // New — volume
    transactions_100: transactionCount >= 100,
    transactions_500: transactionCount >= 500,
    transactions_1000: transactionCount >= 1000,
    xp_1000: totalXP >= 1000,
    xp_5000: totalXP >= 5000,
    level_10: level >= 10,
    level_25: level >= 25,
    // quest_master is awarded from useQuests.refreshQuests when all tier-1 quests complete
    quest_master: false,
  };
}

/**
 * Check if current month has net positive (income > expense).
 */
async function hasPositiveCurrentMonth(db: SQLiteDatabase): Promise<boolean> {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE deleted_at IS NULL
       AND substr(created_at, 1, 7) = ?`,
    [ym]
  );
  if (!row) return false;
  return row.income > row.expense && row.income > 0;
}

/**
 * Count the number of CONSECUTIVE most-recent complete months where
 * no category exceeded its budget_history limit.
 * Stops at first month that either has no budgets or exceeded.
 */
async function countCleanBudgetMonths(
  db: SQLiteDatabase,
  maxLookback: number
): Promise<number> {
  let clean = 0;
  const now = new Date();
  // Start from last complete month
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
      const spent = await count(
        db,
        `SELECT COALESCE(SUM(amount), 0) as count
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND category_id = ?
           AND substr(created_at, 1, 7) = ?`,
        [b.category_id, ym]
      );
      if (spent > b.budget_limit) {
        exceeded = true;
        break;
      }
    }
    if (exceeded) break;
    clean++;
  }
  return clean;
}
