import type { SQLiteDatabase } from 'expo-sqlite';
import { getCurrentCycle, getPreviousCycles } from '@/lib/analysis/cycle';
import { DAY_MS, EMPTY_CYCLE_TX, fetchCycleTxCount } from '@/lib/analysis/sufficiency';
import type { SavedAnalysis } from '@/lib/analysis/persistence';
import type { Cycle, CycleSettings, Indicators } from '@/lib/analysis/types';

/** Profondeur du repli : cycles complets scannés pour trouver de la matière. */
const FALLBACK_CYCLES = 6;

/** Comparaison avec la dernière analyse persistée (bloc « depuis la dernière fois »). */
export interface SinceLast {
  daysSince: number;
  prevKept: number;
  prevMicroTotal: number;
  prevMicroCount: number;
  prevSavingsRate: number | null;
}

/**
 * Choisit le cycle à analyser selon les réglages de cycle personnel (Phase 7).
 * Le cycle courant s'il a de la matière ; sinon, repli sur le cycle complet le
 * plus récent qui en a — 5 mois d'historique ne doivent jamais donner « rien à
 * analyser » le 7 du mois.
 */
export async function pickCycleToAnalyze(
  db: SQLiteDatabase,
  settings: CycleSettings
): Promise<{ cycle: Cycle; txCount: number }> {
  const current = getCurrentCycle(new Date(), settings);
  const currentCount = await fetchCycleTxCount(db, current);
  if (currentCount >= EMPTY_CYCLE_TX) return { cycle: current, txCount: currentCount };
  for (const prev of getPreviousCycles(FALLBACK_CYCLES, undefined, settings)) {
    const n = await fetchCycleTxCount(db, prev);
    if (n >= EMPTY_CYCLE_TX) return { cycle: prev, txCount: n };
  }
  return { cycle: current, txCount: currentCount };
}

/**
 * Delta depuis la dernière analyse persistée — seulement si elle existe et ne
 * date pas de la minute (rechargements d'écran). `null` sinon.
 */
export function computeSinceLast(last: SavedAnalysis | null): SinceLast | null {
  if (!last) return null;
  const daysSince = Math.floor((Date.now() - new Date(last.created_at).getTime()) / DAY_MS);
  if (daysSince < 1) return null;
  try {
    const prev = JSON.parse(last.indicators_json) as Partial<Indicators>;
    return {
      daysSince,
      prevKept: prev.keptAmount ?? 0,
      prevMicroTotal: prev.microTotal ?? 0,
      prevMicroCount: prev.microCount ?? 0,
      prevSavingsRate: prev.savingsRate ?? null,
    };
  } catch {
    return null;
  }
}
