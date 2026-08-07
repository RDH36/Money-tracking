/**
 * Suffisance des données pour un bilan — helpers purs partagés entre
 * `useAnalysis` (écran) et `useAnalysisEntry` (carte du dashboard).
 */
import type { SQLiteDatabase } from 'expo-sqlite';

export const DAY_MS = 86_400_000;
/** Données requises : au moins un cycle complet OU 30 transactions. */
export const MIN_TX = 30;
/** Fenêtre au-delà de laquelle la carte d'entrée réapparaît. */
export const ENTRY_STALE_DAYS = 25;
/** Clé `settings` portant l'horodatage de la dernière analyse vue. */
export const LAST_ANALYSIS_KEY = 'analysis_last_at';
/** En dessous : un cycle est trop vide pour un constat. */
export const EMPTY_CYCLE_TX = 5;

export interface DataStat {
  count: number;
  first: string | null;
}

/** Nombre de transactions (hors virements/supprimées) sur les bornes d'un cycle. */
export async function fetchCycleTxCount(
  db: SQLiteDatabase,
  cycle: { start: string; end: string }
): Promise<number> {
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM transactions
     WHERE deleted_at IS NULL AND transfer_id IS NULL
       AND transaction_date >= ? AND transaction_date < ?`,
    [cycle.start, cycle.end]
  );
  return row?.cnt ?? 0;
}

export async function fetchDataStat(db: SQLiteDatabase): Promise<DataStat> {
  const row = await db.getFirstAsync<{ cnt: number; first: string | null }>(
    `SELECT COUNT(*) AS cnt, MIN(transaction_date) AS first
     FROM transactions WHERE deleted_at IS NULL AND transfer_id IS NULL`
  );
  return { count: row?.cnt ?? 0, first: row?.first ?? null };
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Assez de données pour une analyse fiable ? + jours restants sinon. */
export function assess(stat: DataStat): { enough: boolean; daysUntilReady: number } {
  const hasCompleteCycle = stat.first !== null && stat.first < startOfMonthISO();
  const enough = hasCompleteCycle || stat.count >= MIN_TX;
  const daysSinceFirst = stat.first
    ? Math.floor((Date.now() - new Date(stat.first).getTime()) / DAY_MS)
    : 0;
  return { enough, daysUntilReady: Math.max(1, 30 - daysSinceFirst) };
}
