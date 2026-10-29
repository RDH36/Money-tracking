import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useCycleSettingsValue } from '@/hooks/useCycleSettings';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { parseUsed, quotaCycle, readsLimit, remainingReads } from '@/lib/premium';
import { usePremium } from './usePremium';

/**
 * Lectures de l'import automatique sur le cycle courant (clé `settings`
 * `ocr_reads_{début du cycle}` : un nouveau cycle repart de zéro tout seul).
 * Avec Plus (`ocr_unlimited`), lectures illimitées, même hors ligne.
 */
export function useOcrQuota() {
  const db = useSQLiteContext();
  const cycleSettings = useCycleSettingsValue();
  const version = useDataRefreshStore((s) => s.transactionsVersion);
  const premium = usePremium();
  const [used, setUsed] = useState<number | null>(null);
  // Recalculé à chaque rendu suivant un changement de données : un cycle qui
  // bascule pendant que l'app est ouverte est pris en compte au retour sur « + ».
  const cycle = useMemo(() => quotaCycle(new Date(), cycleSettings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cycleSettings, version]);
  const limit = readsLimit();

  useEffect(() => {
    let alive = true;
    db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [cycle.key])
      .then((row) => { if (alive) setUsed(parseUsed(row?.value)); })
      .catch((err) => {
        console.error('Reading OCR quota failed:', err);
        if (alive) setUsed(0);
      });
    return () => { alive = false; };
  }, [db, cycle.key, version]);

  /** Ajoute `reads` lectures au cycle courant (après un enregistrement). */
  const consume = useCallback(async (reads: number) => {
    if (reads <= 0) return;
    const { key } = quotaCycle(new Date(), cycleSettings);
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
    const next = parseUsed(row?.value) + reads;
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [
      key, String(next), new Date().toISOString(),
    ]);
    if (key === cycle.key) setUsed(next);
  }, [db, cycleSettings, cycle.key]);

  const loaded = used !== null && premium.loaded;
  return {
    loaded,
    unlimited: premium.ocrUnlimited,
    used: used ?? 0,
    limit,
    remaining: premium.ocrUnlimited ? Infinity : remainingReads(used ?? 0, limit),
    resetsOn: cycle.resetsOn,
    consume,
  };
}
