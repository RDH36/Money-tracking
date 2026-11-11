import { FEEDBACK_KEYS } from './rules';

/** Sous-ensemble de la base utilisé ici (expo-sqlite), injectable dans les tests. */
export interface SettingsDb {
  getAllAsync<T>(sql: string, params: string[]): Promise<T[]>;
  runAsync(sql: string, params: string[]): Promise<unknown>;
}

export interface FeedbackState {
  rewardedAt: string | null;
  laterAt: string | null;
  firstReadAt: string | null;
  /** Avis en attente d'envoi (JSON brut). */
  pending: string | null;
  /** Refus définitifs (4xx) déjà essuyés par l'avis en attente. */
  rejects: number;
}

export async function readFeedbackState(db: SettingsDb): Promise<FeedbackState> {
  const keys = Object.values(FEEDBACK_KEYS);
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${keys.map(() => '?').join(', ')})`,
    keys,
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: string) => map.get(k) || null;
  return {
    rewardedAt: get(FEEDBACK_KEYS.rewardedAt),
    laterAt: get(FEEDBACK_KEYS.laterAt),
    firstReadAt: get(FEEDBACK_KEYS.firstReadAt),
    pending: get(FEEDBACK_KEYS.pending),
    rejects: Number(get(FEEDBACK_KEYS.rejects)) || 0,
  };
}

export async function writeFeedbackSetting(db: SettingsDb, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [
    key, value, new Date().toISOString(),
  ]);
}

/** Vide une clé sans supprimer la ligne (valeur vide = absente à la lecture). */
export async function clearFeedbackSetting(db: SettingsDb, key: string): Promise<void> {
  await writeFeedbackSetting(db, key, '');
}
