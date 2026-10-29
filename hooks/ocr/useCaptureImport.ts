import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { dedupeOperations } from '@/lib/ocr';
import { readCaptures } from '@/lib/ocr/import/read';
import {
  loadCategoryHistory, loadExistingForDedupe, loadExpenseCategoryIds, loadImportAccounts,
} from '@/lib/ocr/import/queries';
import { buildReviewItems, isDraftValid, type ReviewItem } from '@/lib/ocr/import/review';
import { saveImportedOperations } from '@/lib/ocr/import/save';

export type ImportPhase = 'reading' | 'review' | 'saving' | 'done' | 'error';

export interface ImportStats {
  captures: number;
  sources: string[];
  unrecognized: number;
  failed: number;
  partial: number;
  /** Opérations présentes sur plusieurs captures, fusionnées. */
  merged: number;
}

const EMPTY_STATS: ImportStats = {
  captures: 0, sources: [], unrecognized: 0, failed: 0, partial: 0, merged: 0,
};

/**
 * Parcours complet de l'import par capture : lecture OCR → analyse →
 * anti-doublon → brouillons modifiables → enregistrement.
 */
export function useCaptureImport(uris: string[]) {
  const db = useSQLiteContext();
  const [phase, setPhase] = useState<ImportPhase>('reading');
  const [progress, setProgress] = useState({ done: 0, total: uris.length });
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ImportStats>(EMPTY_STATS);
  const [savedCount, setSavedCount] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const urisKey = uris.join('|');

  // Relancé à chaque nouvelle liste de captures (« Importer d'autres captures »,
  // nouveau partage qui remplace l'écran) : l'état repart de zéro.
  useEffect(() => {
    if (uris.length === 0) return;
    let cancelled = false;
    setPhase('reading');
    setProgress({ done: 0, total: uris.length });
    setItems([]);
    setStats(EMPTY_STATS);
    setSaveFailed(false);
    (async () => {
      try {
        const reading = await readCaptures(uris, (done, total) => {
          if (!cancelled) setProgress({ done, total });
        });
        const existing = await loadExistingForDedupe(db, reading.operations);
        const { items: deduped, merged } = dedupeOperations(reading.operations, existing);
        const [history, validCategoryIds, accounts] = await Promise.all([
          loadCategoryHistory(db),
          loadExpenseCategoryIds(db),
          loadImportAccounts(db, reading.sources[0] ?? 'mcb'),
        ]);
        if (cancelled) return;
        setItems(buildReviewItems(deduped, { history, validCategoryIds, ...accounts }));
        setStats({
          captures: uris.length,
          sources: reading.sources,
          unrecognized: reading.unrecognized,
          failed: reading.failed,
          partial: reading.partial,
          merged,
        });
        setPhase('review');
      } catch (err) {
        console.error('Capture import failed:', err);
        if (!cancelled) setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // urisKey : relancer uniquement si la liste de captures change vraiment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, urisKey]);

  const toggle = useCallback((key: string) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, selected: !i.selected } : i)));
  }, []);

  const update = useCallback((key: string, patch: Partial<ReviewItem>) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        // Montant corrigé : ce n'est plus l'opération déjà enregistrée, le badge doublon tombe.
        const amountChanged = patch.amount !== undefined && patch.amount !== i.amount;
        return { ...i, ...patch, duplicate: amountChanged ? null : i.duplicate };
      })
    );
  }, []);

  /** Change le compte bancaire de toutes les opérations. */
  const setAccountForAll = useCallback((accountId: string) => {
    setItems((prev) =>
      prev.map((i) => ({
        ...i,
        accountId,
        counterAccountId: i.counterAccountId === accountId ? null : i.counterAccountId,
      }))
    );
  }, []);

  const toSave = items.filter((i) => i.selected && isDraftValid(i));
  const invalidSelected = items.filter((i) => i.selected && !isDraftValid(i)).length;

  const save = useCallback(async () => {
    if (toSave.length === 0) return;
    setPhase('saving');
    setSaveFailed(false);
    try {
      setSavedCount(await saveImportedOperations(
        db, toSave.map((i) => ({ ...i, forceDuplicate: i.duplicate !== null }))
      ));
      setPhase('done');
    } catch (err) {
      console.error('Saving imported operations failed:', err);
      // Rien n'est écrit (transaction annulée) : retour à la vérification.
      setSaveFailed(true);
      setPhase('review');
    }
  }, [db, toSave]);

  // Capture en cours de lecture (miniature de l'écran de chargement).
  const currentUri = uris[Math.min(progress.done, uris.length - 1)] ?? null;

  return {
    phase, progress, currentUri, items, stats, savedCount, saveFailed,
    selectedCount: toSave.length, invalidSelected,
    toggle, update, setAccountForAll, save,
  };
}
