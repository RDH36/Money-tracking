import type { SQLiteDatabase } from 'expo-sqlite';
import { QUESTS } from './quests';

interface QuestRow {
  id: string;
  current_step: number;
}

/**
 * Recalculate total XP from authoritative sources in the DB.
 *
 * Used to repair test accounts affected by the stale-closure XP spam bug.
 * Computes a conservative floor:
 *   - Sum of quest step XP for every completed step (one time per step)
 *   - +2000 if quest_master badge earned
 *   - +1600 baseline floor (covers early activity — level 5 equivalent)
 *
 * This is intentionally approximate: it discards the XP history from
 * transactions/streaks/daily-weekly-monthly challenges (we don't keep a log),
 * so legitimate high-XP users should NOT run this. It's a repair tool
 * for accounts with clearly inflated totals.
 */
export async function recalculateXP(db: SQLiteDatabase): Promise<number> {
  // Sum legit XP from quest steps (current_step in DB is authoritative)
  const questRows = await db.getAllAsync<QuestRow>(
    'SELECT id, current_step FROM quests'
  );
  const questXPMap = new Map(QUESTS.map((q) => [q.id, q]));

  let questXP = 0;
  for (const row of questRows) {
    const def = questXPMap.get(row.id);
    if (!def) continue;
    for (let i = 0; i < Math.min(row.current_step, def.steps.length); i++) {
      questXP += def.steps[i].xp;
    }
  }

  // +2000 if quest_master badge earned
  const questMasterRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM badges WHERE badge_type = 'quest_master'`
  );
  const questMasterBonus = (questMasterRow?.count ?? 0) > 0 ? 2000 : 0;

  // Conservative baseline (covers early activity, level 5 equivalent)
  const baselineXP = 1600;

  const newTotal = questXP + questMasterBonus + baselineXP;

  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE gamification SET value = ?, updated_at = ? WHERE key = 'total_xp'`,
    [String(newTotal), now]
  );

  return newTotal;
}
