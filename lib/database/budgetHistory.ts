import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Ensures that `budget_history` has an entry for the current month for every
 * category that currently has a `budget_limit`. Missing entries are filled by
 * carrying forward the category's current `budget_limit` (which reflects the
 * last month's active limit, since updateCategory writes it on every edit).
 *
 * Uses `INSERT OR IGNORE` so any manual edit the user has already made for the
 * current month is preserved — the user can still freely refresh the current
 * month's threshold through EditCategoryModal.
 *
 * This function makes the annual cumulative report in `useBudgetForPeriod`
 * accurate even when the user does not manually set a new threshold each month.
 */
export async function ensureCurrentMonthBudgetHistory(
  db: SQLiteDatabase
): Promise<void> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isoNow = now.toISOString();

  await db.runAsync(
    `INSERT OR IGNORE INTO budget_history (category_id, year_month, budget_limit, created_at)
     SELECT id, ?, budget_limit, ?
     FROM categories
     WHERE budget_limit IS NOT NULL AND deleted_at IS NULL`,
    [yearMonth, isoNow]
  );
}
