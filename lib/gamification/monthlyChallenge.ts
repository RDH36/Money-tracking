import type { SQLiteDatabase } from 'expo-sqlite';
import {
  MONTHLY_CHALLENGE_TARGETS,
  MONTHLY_CHALLENGE_TYPES,
  type MonthlyChallengeType,
} from '@/constants/badges';

/** Returns the current month in YYYY-MM format (local time). */
export function getCurrentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function pickRandomMonthlyChallenge(): MonthlyChallengeType {
  const index = Math.floor(Math.random() * MONTHLY_CHALLENGE_TYPES.length);
  return MONTHLY_CHALLENGE_TYPES[index];
}

interface ProgressResult {
  progress: number;
  target: number;
}

/**
 * Compute current progress for a monthly challenge type.
 * Progress is capped at target.
 */
export async function computeMonthlyProgress(
  db: SQLiteDatabase,
  type: MonthlyChallengeType,
  month: string
): Promise<ProgressResult> {
  const target = MONTHLY_CHALLENGE_TARGETS[type];

  switch (type) {
    case 'monthly_50_transactions': {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM transactions
         WHERE deleted_at IS NULL
           AND substr(created_at, 1, 7) = ?`,
        [month]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'monthly_3_plans': {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM planifications
         WHERE status = 'completed' AND deleted_at IS NULL
           AND substr(updated_at, 1, 7) = ?`,
        [month]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'monthly_15_day_streak': {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as count
         FROM transactions
         WHERE deleted_at IS NULL
           AND substr(created_at, 1, 7) = ?`,
        [month]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'monthly_6_categories': {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT category_id) as count FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND category_id IS NOT NULL
           AND substr(created_at, 1, 7) = ?`,
        [month]
      );
      return { progress: Math.min(row?.count ?? 0, target), target };
    }
    case 'monthly_full_budget_clean': {
      const budgets = await db.getAllAsync<{ category_id: string; budget_limit: number }>(
        `SELECT category_id, budget_limit FROM budget_history WHERE year_month = ?`,
        [month]
      );
      if (budgets.length === 0) return { progress: 0, target };
      for (const b of budgets) {
        const row = await db.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND category_id = ?
             AND substr(created_at, 1, 7) = ?`,
          [b.category_id, month]
        );
        if ((row?.total ?? 0) > b.budget_limit) return { progress: 0, target };
      }
      return { progress: 1, target };
    }
    default:
      return { progress: 0, target };
  }
}
