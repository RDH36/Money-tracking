import { useState, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { assess, fetchDataStat } from '@/lib/analysis/sufficiency';
import { scheduleAnalysisReadyReminder } from '@/lib/notifications';

/**
 * Faut-il afficher la carte d'entrée sous le hero ? Visible dès que les
 * données suffisent — un point d'entrée qui apparaît et disparaît n'est pas
 * trouvable (retour propriétaire, remplace la fenêtre de 25 j du PRD).
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
      if (alive) setVisible(enough);
      if (enough) scheduleAnalysisReadyReminder().catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, [db, transactionsVersion]);

  return { visible };
}
