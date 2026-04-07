import type { SQLiteDatabase } from 'expo-sqlite';
import type { DailyChallengeType } from '@/constants/badges';

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

interface CountRow { count: number }

/**
 * Validate if a daily challenge condition is currently met for today.
 * For retroactive checks (yesterday's save_today / stay_under_budget),
 * call validateRetroactiveDailyChallenge instead.
 *
 * Returns true when the challenge should be marked complete.
 */
export async function validateActiveDailyChallenge(
  db: SQLiteDatabase,
  type: DailyChallengeType
): Promise<boolean> {
  const today = getToday();
  switch (type) {
    case 'log_before_noon': {
      const now = new Date();
      if (now.getHours() >= 12) return false;
      const row = await db.getFirstAsync<CountRow>(
        `SELECT COUNT(*) as count FROM transactions
         WHERE deleted_at IS NULL
           AND substr(created_at, 1, 10) = ?
           AND CAST(substr(created_at, 12, 2) AS INTEGER) < 12`,
        [today]
      );
      return (row?.count ?? 0) >= 1;
    }
    case 'categorize_all': {
      const row = await db.getFirstAsync<CountRow>(
        `SELECT COUNT(DISTINCT category_id) as count FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND category_id IS NOT NULL
           AND substr(created_at, 1, 10) = ?`,
        [today]
      );
      return (row?.count ?? 0) >= 2;
    }
    case 'review_budget':
      // Active trigger only — caller explicitly signals report was opened
      return true;
    case 'stay_under_budget':
    case 'save_today':
      // These are retroactive — cannot complete in real time
      return false;
    default:
      return false;
  }
}

/**
 * Validate a previous-day challenge retroactively (called at day rollover).
 * Handles save_today and stay_under_budget.
 */
export async function validateRetroactiveDailyChallenge(
  db: SQLiteDatabase,
  type: DailyChallengeType,
  forDate: string
): Promise<boolean> {
  switch (type) {
    case 'save_today': {
      const row = await db.getFirstAsync<CountRow>(
        `SELECT COUNT(*) as count FROM transactions
         WHERE deleted_at IS NULL
           AND type = 'expense'
           AND substr(created_at, 1, 10) = ?`,
        [forDate]
      );
      return (row?.count ?? 0) === 0;
    }
    case 'stay_under_budget': {
      // For the given date's month, check that no category has exceeded its budget
      // BEFORE or DURING that date (inclusive). We use month-to-date through that date.
      const ym = forDate.slice(0, 7);
      const budgets = await db.getAllAsync<{ category_id: string; budget_limit: number }>(
        `SELECT category_id, budget_limit FROM budget_history WHERE year_month = ?`,
        [ym]
      );
      if (budgets.length === 0) return false;
      for (const b of budgets) {
        const row = await db.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE deleted_at IS NULL
             AND type = 'expense'
             AND category_id = ?
             AND substr(created_at, 1, 10) <= ?`,
          [b.category_id, forDate]
        );
        if ((row?.total ?? 0) > b.budget_limit) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

export { getToday, getYesterday };
