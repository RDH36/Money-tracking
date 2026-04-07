import type { SQLiteDatabase } from 'expo-sqlite';
import {
  WEEKLY_CHALLENGE_TARGETS,
  WEEKLY_CHALLENGE_TYPES,
  type WeeklyChallengeType,
} from '@/constants/badges';

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns the ISO date (YYYY-MM-DD) of Monday of the current week (local time).
 * Treats Monday as first day of week.
 */
export function getCurrentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetToMonday);
  return formatLocalDate(monday);
}

export function pickRandomWeeklyChallenge(): WeeklyChallengeType {
  const index = Math.floor(Math.random() * WEEKLY_CHALLENGE_TYPES.length);
  return WEEKLY_CHALLENGE_TYPES[index];
}

interface ProgressResult {
  progress: number;
  target: number;
}

/**
 * Compute current progress for a weekly challenge type, starting from weekStart.
 * Progress is capped at target.
 */
export async function computeWeeklyProgress(
  db: SQLiteDatabase,
  type: WeeklyChallengeType,
  weekStart: string
): Promise<ProgressResult> {
  const target = WEEKLY_CHALLENGE_TARGETS[type];

  switch (type) {
    case 'weekly_streak': {
      // Distinct days with at least one transaction since weekStart
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as count
         FROM transactions
         WHERE deleted_at IS NULL
           AND substr(created_at, 1, 10) >= ?`,
        [weekStart]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'weekly_3_categories': {
      // Distinct categories used in expenses since weekStart
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT category_id) as count
         FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND category_id IS NOT NULL
           AND substr(created_at, 1, 10) >= ?`,
        [weekStart]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'weekly_plan_validate': {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM planifications
         WHERE status = 'completed'
           AND deleted_at IS NULL
           AND substr(updated_at, 1, 10) >= ?`,
        [weekStart]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'weekly_save': {
      // Count distinct completed days (before today) since weekStart with 0 expenses
      const today = formatLocalDate(new Date());
      const days: string[] = [];
      const start = new Date(weekStart + 'T00:00:00');
      const cursor = new Date(start);
      while (formatLocalDate(cursor) < today) {
        days.push(formatLocalDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      let noSpendDays = 0;
      for (const d of days) {
        const row = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND substr(created_at, 1, 10) = ?`,
          [d]
        );
        if ((row?.count ?? 0) === 0) noSpendDays++;
      }
      return { progress: Math.min(noSpendDays, target), target };
    }
    case 'weekly_budget_respect': {
      // Progress = 1 if no category has exceeded its budget for the current month so far
      const now = new Date();
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const budgets = await db.getAllAsync<{ category_id: string; budget_limit: number }>(
        `SELECT category_id, budget_limit FROM budget_history WHERE year_month = ?`,
        [ym]
      );
      if (budgets.length === 0) return { progress: 0, target };
      for (const b of budgets) {
        const row = await db.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND category_id = ?
             AND substr(created_at, 1, 7) = ?`,
          [b.category_id, ym]
        );
        if ((row?.total ?? 0) > b.budget_limit) return { progress: 0, target };
      }
      return { progress: 1, target };
    }
    default:
      return { progress: 0, target };
  }
}
