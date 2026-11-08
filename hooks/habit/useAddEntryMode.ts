import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';

export type AddEntryMode = 'normal' | 'onboarding' | 'reminder';

/**
 * Mode d'arrivée sur l'onglet Ajouter :
 * - `source=onboarding` ET aucune transaction → 1re dépense guidée ;
 * - `source=reminder_evening` (tap sur le rappel du soir) → bandeau du jour.
 * Les paramètres d'un onglet restent collés au retour : la source est lue
 * UNE fois (paramètre nettoyé aussitôt), puis oubliée quand l'onglet perd le
 * focus. `t` (horodatage) distingue deux taps successifs sur le rappel.
 */
export function useAddEntryMode() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ source?: string; t?: string }>();
  const version = useDataRefreshStore((s) => s.transactionsVersion);
  const [source, setSource] = useState<string | undefined>(params.source || undefined);
  const [txCount, setTxCount] = useState<number | null>(null);

  useEffect(() => {
    if (!params.source) return;
    setSource(params.source);
    router.setParams({ source: undefined, t: undefined });
  }, [params.source, params.t]);

  useFocusEffect(useCallback(() => () => setSource(undefined), []));

  useEffect(() => {
    let alive = true;
    db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions WHERE deleted_at IS NULL')
      .then((row) => { if (alive) setTxCount(row?.n ?? 0); })
      .catch(() => { if (alive) setTxCount(0); });
    return () => { alive = false; };
  }, [db, version]);

  // Tant que le compte n'est pas lu, on suppose 0 : on arrive de l'onboarding.
  const mode: AddEntryMode = source === 'onboarding' && (txCount ?? 0) === 0
    ? 'onboarding'
    : source === 'reminder_evening' ? 'reminder' : 'normal';

  /** Source d'arrivée de cette visite (mesure de l'activation). */
  return { mode, source };
}
