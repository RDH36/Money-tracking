import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { getCurrentCycle, getPreviousCycles } from '@/lib/analysis/cycle';
import { getIndicators } from '@/lib/analysis/indicators';
import { scoreInsights, type ScoreResult } from '@/lib/analysis/score';
import {
  saveAnalysis,
  getLastAnalysis,
  getDismissedIds,
  dismissInsight,
  markActionApplied,
} from '@/lib/analysis/persistence';
import {
  DAY_MS,
  EMPTY_CYCLE_TX,
  LAST_ANALYSIS_KEY,
  assess,
  fetchCycleTxCount,
  fetchDataStat,
} from '@/lib/analysis/sufficiency';
import type { Cycle, Indicators } from '@/lib/analysis/types';

/** Au-dessus (avec revenu) : un « mois calme » devient une info crédible. */
const CALM_MIN_TX = 15;
/** Profondeur du repli : cycles complets scannés pour trouver de la matière. */
const FALLBACK_CYCLES = 6;

/**
 * État explicite de l'analyse. `calmMonth` exige des conditions POSITIVES
 * (revenu présent, activité réelle) : il ne peut plus jamais être atteint par
 * absence de données.
 */
export type AnalysisState =
  | 'insufficientData'
  | 'emptyCycle'
  | 'noIncome'
  | 'calmMonth'
  | 'normal';

/** Comparaison avec la dernière analyse persistée (bloc « depuis la dernière fois »). */
export interface SinceLast {
  daysSince: number;
  prevKept: number;
  prevMicroTotal: number;
  prevMicroCount: number;
  prevSavingsRate: number | null;
}

/**
 * Choisit le cycle à analyser. Le cycle courant s'il a de la matière ; sinon,
 * repli sur le cycle complet le plus récent qui en a — 5 mois d'historique ne
 * doivent jamais donner « rien à analyser » le 7 du mois.
 */
async function pickCycleToAnalyze(
  db: ReturnType<typeof useSQLiteContext>
): Promise<{ cycle: Cycle; txCount: number }> {
  const current = getCurrentCycle();
  const currentCount = await fetchCycleTxCount(db, current);
  if (currentCount >= EMPTY_CYCLE_TX) return { cycle: current, txCount: currentCount };
  for (const prev of getPreviousCycles(FALLBACK_CYCLES)) {
    const n = await fetchCycleTxCount(db, prev);
    if (n >= EMPTY_CYCLE_TX) return { cycle: prev, txCount: n };
  }
  return { cycle: current, txCount: currentCount };
}

export interface UseAnalysisResult {
  loading: boolean;
  state: AnalysisState;
  daysUntilReady: number;
  cycleTxCount: number;
  cycle: Cycle | null;
  indicators: Indicators | null;
  result: ScoreResult | null;
  /** Delta depuis la dernière analyse persistée, ou null (première analyse). */
  sinceLast: SinceLast | null;
  /** Rejette un constat — persisté en base (fenêtre 60 j). */
  dismiss: (id: string) => void;
  /**
   * Persiste l'analyse (max 1/semaine) + horodatage carte d'entrée.
   * Résout avec l'id créé, ou null si rien n'a été écrit (déjà persistée).
   */
  markAnalyzed: () => Promise<string | null>;
  /** Marque l'action de l'analyse courante comme appliquée. */
  recordActionApplied: () => Promise<void>;
}

export function useAnalysis(): UseAnalysisResult {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [enough, setEnough] = useState(false);
  const [daysUntilReady, setDaysUntilReady] = useState(30);
  const [cycleTxCount, setCycleTxCount] = useState(0);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [sinceLast, setSinceLast] = useState<SinceLast | null>(null);
  // Id de la ligne `analyses` couvrant cette session d'écran (créée ou reprise).
  const analysisIdRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const stat = await fetchDataStat(db);
      const a = assess(stat);
      if (!alive) return;
      setEnough(a.enough);
      setDaysUntilReady(a.daysUntilReady);
      if (!a.enough) {
        setLoading(false);
        return;
      }
      const { cycle: c, txCount: count } = await pickCycleToAnalyze(db);
      const [ind, dismissed, last] = await Promise.all([
        getIndicators(db, c),
        getDismissedIds(db),
        getLastAnalysis(db),
      ]);
      if (!alive) return;
      // Comparaison avec la dernière analyse persistée — seulement si elle
      // existe et ne date pas de la minute (rechargements d'écran).
      if (last) {
        analysisIdRef.current = last.id;
        const daysSince = Math.floor((Date.now() - new Date(last.created_at).getTime()) / DAY_MS);
        if (daysSince >= 1) {
          try {
            const prev = JSON.parse(last.indicators_json) as Partial<Indicators>;
            setSinceLast({
              daysSince,
              prevKept: prev.keptAmount ?? 0,
              prevMicroTotal: prev.microTotal ?? 0,
              prevMicroCount: prev.microCount ?? 0,
              prevSavingsRate: prev.savingsRate ?? null,
            });
          } catch {
            setSinceLast(null);
          }
        }
      }
      setCycle(c);
      setIndicators(ind);
      setCycleTxCount(count);
      setDismissedIds(dismissed);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  const result = useMemo<ScoreResult | null>(
    () => (indicators && cycle ? scoreInsights(indicators, cycle, dismissedIds) : null),
    [indicators, cycle, dismissedIds]
  );

  const state = useMemo<AnalysisState>(() => {
    if (!enough) return 'insufficientData';
    if (cycleTxCount < EMPTY_CYCLE_TX) return 'emptyCycle';
    if (!indicators || indicators.income === 0) return 'noIncome';
    if (cycleTxCount >= CALM_MIN_TX && (result?.insights.length ?? 0) < 2) return 'calmMonth';
    return 'normal';
  }, [enough, cycleTxCount, indicators, result]);

  const dismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      dismissInsight(db, id).catch(() => {});
    },
    [db]
  );

  const markAnalyzed = useCallback(async (): Promise<string | null> => {
    const now = new Date().toISOString();
    await db
      .runAsync(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, [
        LAST_ANALYSIS_KEY,
        now,
        now,
      ])
      .catch(() => {});
    if (!cycle || !indicators || !result) return null;
    const id = await saveAnalysis(
      db,
      cycle,
      indicators,
      result.insights,
      result.action?.type ?? null
    ).catch(() => null);
    if (id) analysisIdRef.current = id;
    return id;
  }, [db, cycle, indicators, result]);

  const recordActionApplied = useCallback(async () => {
    if (analysisIdRef.current) await markActionApplied(db, analysisIdRef.current).catch(() => {});
  }, [db]);

  return {
    loading,
    state,
    daysUntilReady,
    cycleTxCount,
    cycle,
    indicators,
    result,
    sinceLast,
    dismiss,
    markAnalyzed,
    recordActionApplied,
  };
}
