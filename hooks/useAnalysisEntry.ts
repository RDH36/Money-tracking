import { useState, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import {
  DAY_MS,
  ENTRY_STALE_DAYS,
  LAST_ANALYSIS_KEY,
  assess,
  fetchDataStat,
} from '@/lib/analysis/sufficiency';
import { scheduleAnalysisReadyReminder } from '@/lib/notifications';

/**
 * Décision légère : faut-il afficher la carte d'entrée sous le hero ?
 * Visible si les données suffisent ET qu'aucune analyse récente (< 25 jours).
 * Profite du passage pour (re)programmer le rappel de fin de cycle.
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
