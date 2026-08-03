import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { getCurrentCycle } from '@/lib/analysis/cycle';
import { getIndicators } from '@/lib/analysis/indicators';
import { scoreInsights, type ScoreResult } from '@/lib/analysis/score';
import type { Cycle, Indicators } from '@/lib/analysis/types';

const DAY_MS = 86_400_000;
/** Données requises : au moins un cycle complet OU 30 transactions. */
const MIN_TX = 30;
/** Fenêtre au-delà de laquelle la carte d'entrée réapparaît. */
const ENTRY_STALE_DAYS = 25;
const LAST_ANALYSIS_KEY = 'analysis_last_at';

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

interface DataStat {
  count: number;
  first: string | null;
}

async function fetchDataStat(db: ReturnType<typeof useSQLiteContext>): Promise<DataStat> {
  const row = await db.getFirstAsync<{ cnt: number; first: string | null }>(
    `SELECT COUNT(*) AS cnt, MIN(transaction_date) AS first
     FROM transactions WHERE deleted_at IS NULL AND transfer_id IS NULL`
  );
  return { count: row?.cnt ?? 0, first: row?.first ?? null };
}

/** Assez de données pour une analyse fiable ? + jours restants sinon. */
function assess(stat: DataStat): { enough: boolean; daysUntilReady: number } {
  const hasCompleteCycle = stat.first !== null && stat.first < startOfMonthISO();
  const enough = hasCompleteCycle || stat.count >= MIN_TX;
  const daysSinceFirst = stat.first
    ? Math.floor((Date.now() - new Date(stat.first).getTime()) / DAY_MS)
    : 0;
  return { enough, daysUntilReady: Math.max(1, 30 - daysSinceFirst) };
}

export interface AnalysisState {
  loading: boolean;
  status: 'insufficient' | 'ready';
  daysUntilReady: number;
  cycle: Cycle | null;
  indicators: Indicators | null;
  result: ScoreResult | null;
  dismissedIds: string[];
  /** Marque un constat comme « ne m'aide pas » (persistance en Phase 4). */
  dismiss: (id: string) => void;
  /** Enregistre l'horodatage de l'analyse (pilote la carte d'entrée). */
  markAnalyzed: () => void;
}

/**
 * Orchestre cycle → indicateurs → scoring pour l'écran d'analyse. Gère le
 * chargement, le cas « données insuffisantes », et le rejet local des constats.
 */
export function useAnalysis(): AnalysisState {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'insufficient' | 'ready'>('insufficient');
  const [daysUntilReady, setDaysUntilReady] = useState(30);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const stat = await fetchDataStat(db);
      const { enough, daysUntilReady: days } = assess(stat);
      if (!alive) return;
      if (!enough) {
        setStatus('insufficient');
        setDaysUntilReady(days);
        setLoading(false);
        return;
      }
      const c = getCurrentCycle();
      const ind = await getIndicators(db, c);
      if (!alive) return;
      setCycle(c);
      setIndicators(ind);
      setStatus('ready');
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  // Le scoring se recalcule quand un constat est rejeté — sans requête.
  const result = useMemo<ScoreResult | null>(
    () => (indicators && cycle ? scoreInsights(indicators, cycle, dismissedIds) : null),
    [indicators, cycle, dismissedIds]
  );

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAnalyzed = useCallback(() => {
    db.runAsync(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      [LAST_ANALYSIS_KEY, new Date().toISOString(), new Date().toISOString()]
    ).catch(() => {});
  }, [db]);

  return { loading, status, daysUntilReady, cycle, indicators, result, dismissedIds, dismiss, markAnalyzed };
}

/**
 * Décision légère (sans lancer le calcul complet) : faut-il afficher la carte
 * d'entrée sous le hero ? Visible si les données suffisent ET qu'aucune analyse
 * récente (< 25 jours) n'a déjà été faite.
 */
export function useAnalysisEntry(): { visible: boolean } {
  const db = useSQLiteContext();
  const [visible, setVisible] = useState(false);
  const transactionsVersion = useDataRefreshStore((s) => s.transactionsVersion);

  useEffect(() => {
    let alive = true;
    (async () => {
      const stat = await fetchDataStat(db);
      const { enough } = assess(stat);
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [LAST_ANALYSIS_KEY]
      );
      const lastAt = row?.value ?? null;
      const daysSince = lastAt ? (Date.now() - new Date(lastAt).getTime()) / DAY_MS : Infinity;
      if (alive) setVisible(enough && daysSince >= ENTRY_STALE_DAYS);
    })();
    return () => {
      alive = false;
    };
  }, [db, transactionsVersion]);

  return { visible };
}
