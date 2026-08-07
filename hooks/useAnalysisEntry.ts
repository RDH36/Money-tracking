import { useState, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { getPreviousCycles } from '@/lib/analysis/cycle';
import {
  DAY_MS,
  EMPTY_CYCLE_TX,
  ENTRY_STALE_DAYS,
  LAST_ANALYSIS_KEY,
  assess,
  fetchCycleTxCount,
  fetchDataStat,
} from '@/lib/analysis/sufficiency';
import { scheduleAnalysisReadyReminder } from '@/lib/notifications';

/**
 * Décision légère : faut-il afficher la carte d'entrée sous le hero ?
 * Conditions du PRD : (cycle terminé non analysé) OU (≥ 25 jours depuis la
 * dernière analyse) — ET assez de données. Profite du passage pour
 * (re)programmer le rappel de fin de cycle.
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

      // ≥ 25 jours depuis la dernière analyse vue ?
      const row = await db.getFirstAsync<{ value: string }>(
        `SELECT value FROM settings WHERE key = ?`,
        [LAST_ANALYSIS_KEY]
      );
      const lastAt = row?.value ?? null;
      const stale = lastAt
        ? (Date.now() - new Date(lastAt).getTime()) / DAY_MS >= ENTRY_STALE_DAYS
        : true;

      // Cycle terminé, avec de la matière, jamais analysé ?
      const prevCycle = getPreviousCycles(1)[0];
      const prevCount = await fetchCycleTxCount(db, prevCycle);
      const analyzedRow = await db
        .getFirstAsync<{ cnt: number }>(
          `SELECT COUNT(*) AS cnt FROM analyses WHERE cycle_label = ?`,
          [prevCycle.label]
        )
        .catch(() => null);
      const prevUnanalyzed = prevCount >= EMPTY_CYCLE_TX && (analyzedRow?.cnt ?? 0) === 0;

      if (alive) setVisible(enough && (prevUnanalyzed || stale));
      // Rappel « ton bilan est prêt » pour le début du cycle suivant —
      // seulement quand il y a assez de données pour qu'un bilan existe.
      if (enough) scheduleAnalysisReadyReminder().catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, [db, transactionsVersion]);

  return { visible };
}
