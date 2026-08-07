/**
 * Persistance des bilans (Phase 4) — fonctions pures DB, aucune dépendance
 * React. Tables `analyses` et `analysis_dismissed` (migration 25).
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Cycle, Indicators, Insight } from './types';

const DAY_MS = 86_400_000;
/** Fenêtre pendant laquelle un constat rejeté reste écarté du scoring. */
export const DISMISS_WINDOW_DAYS = 60;
/** Fréquence maximale de persistance : une analyse par semaine. */
const MIN_DAYS_BETWEEN_ANALYSES = 7;

export interface SavedAnalysis {
  id: string;
  cycle_label: string;
  created_at: string;
  indicators_json: string;
  insight_ids: string;
  action_type: string | null;
  action_applied_at: string | null;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Dernière analyse persistée (la plus récente), ou null. */
export async function getLastAnalysis(db: SQLiteDatabase): Promise<SavedAnalysis | null> {
  return db.getFirstAsync<SavedAnalysis>(
    `SELECT * FROM analyses ORDER BY created_at DESC LIMIT 1`
  );
}

/**
 * Persiste une analyse générée. Fréquence limitée : si la dernière analyse a
 * moins de 7 jours, on ne réécrit rien (rouvrir l'écran cinq fois par jour ne
 * doit pas créer cinq lignes). Retourne l'id créé, ou null si rien n'a été
 * écrit — le déclencheur d'XP s'appuie dessus.
 */
export async function saveAnalysis(
  db: SQLiteDatabase,
  cycle: Cycle,
  indicators: Indicators,
  insights: Insight[],
  actionType: string | null
): Promise<string | null> {
  const last = await getLastAnalysis(db);
  if (last) {
    const ageDays = (Date.now() - new Date(last.created_at).getTime()) / DAY_MS;
    if (ageDays < MIN_DAYS_BETWEEN_ANALYSES) return null;
  }
  const id = generateId();
  const now = new Date().toISOString();
  // On ne stocke pas le champ `cycle` (redondant avec cycle_label) ni les
  // dérives détaillées : l'objet sert à la comparaison « depuis la dernière
  // fois », pas à rejouer l'analyse.
  const { cycle: _cycle, categoryDrift: _drift, recurring: _rec, ...compact } = indicators;
  await db.runAsync(
    `INSERT INTO analyses (id, cycle_label, created_at, indicators_json, insight_ids, action_type, action_applied_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [id, cycle.label, now, JSON.stringify(compact), JSON.stringify(insights.map((i) => i.id)), actionType]
  );
  return id;
}

/** Marque l'action de l'analyse comme appliquée (bouton du bloc action). */
export async function markActionApplied(db: SQLiteDatabase, analysisId: string): Promise<void> {
  await db.runAsync(`UPDATE analyses SET action_applied_at = ? WHERE id = ?`, [
    new Date().toISOString(),
    analysisId,
  ]);
}

/** Rejette un constat (« ne m'aide pas ») — upsert avec horodatage frais. */
export async function dismissInsight(db: SQLiteDatabase, insightId: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO analysis_dismissed (insight_id, dismissed_at) VALUES (?, ?)`,
    [insightId, new Date().toISOString()]
  );
}

/** Annule un rejet (« Constat masqué · Annuler »). */
export async function undismissInsight(db: SQLiteDatabase, insightId: string): Promise<void> {
  await db.runAsync(`DELETE FROM analysis_dismissed WHERE insight_id = ?`, [insightId]);
}

/** Ids des constats rejetés dans la fenêtre glissante (60 j par défaut). */
export async function getDismissedIds(
  db: SQLiteDatabase,
  windowDays: number = DISMISS_WINDOW_DAYS
): Promise<string[]> {
  const cutoff = new Date(Date.now() - windowDays * DAY_MS).toISOString();
  const rows = await db.getAllAsync<{ insight_id: string }>(
    `SELECT insight_id FROM analysis_dismissed WHERE dismissed_at >= ?`,
    [cutoff]
  );
  return rows.map((r) => r.insight_id);
}
