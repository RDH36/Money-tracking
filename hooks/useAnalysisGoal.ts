import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';
import type { AnalysisGoal } from '@/lib/analysis/score';

const GOAL_KEY = 'analysis_goal';
const GOAL_AMOUNT_KEY = 'analysis_goal_amount';

const VALID_GOALS: AnalysisGoal[] = ['saveAmount', 'keepBudgets', 'understand'];

/**
 * Objectif durable de l'utilisateur (Phase 6), stocké dans `settings` — donc
 * inclus dans le backup sans travail supplémentaire. `goalAmount` en centimes,
 * seulement pour `saveAmount`.
 */
export function useAnalysisGoal() {
  const db = useSQLiteContext();
  const [goal, setGoalState] = useState<AnalysisGoal | null>(null);
  const [goalAmount, setGoalAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [g, a] = await Promise.all([
        db.getFirstAsync<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [GOAL_KEY]),
        db.getFirstAsync<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [
          GOAL_AMOUNT_KEY,
        ]),
      ]);
      if (!alive) return;
      const value = g?.value as AnalysisGoal | undefined;
      setGoalState(value && VALID_GOALS.includes(value) ? value : null);
      const amount = a?.value ? Number(a.value) : NaN;
      setGoalAmount(Number.isFinite(amount) && amount > 0 ? amount : null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  const setGoal = useCallback(
    async (nextGoal: AnalysisGoal, amountCentimes?: number) => {
      const now = new Date().toISOString();
      setGoalState(nextGoal);
      setGoalAmount(nextGoal === 'saveAmount' ? amountCentimes ?? null : null);
      await db
        .runAsync(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
          GOAL_KEY,
          nextGoal,
          now,
        ])
        .catch(() => {});
      await db
        .runAsync(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
          GOAL_AMOUNT_KEY,
          nextGoal === 'saveAmount' && amountCentimes ? String(amountCentimes) : '',
          now,
        ])
        .catch(() => {});
    },
    [db]
  );

  return { goal, goalAmount, loading, setGoal };
}
