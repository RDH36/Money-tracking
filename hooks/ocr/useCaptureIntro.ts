import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';

/** Explication « quelle capture faire » vue au moins une fois. */
const SEEN_KEY = 'ocr_import_intro_seen_at';

// Cache de session : la carte d'import est remontée à chaque visite de « + ».
let seenCache: boolean | null = null;

/**
 * Première utilisation de l'import par capture : la carte d'entrée ouvre
 * d'abord une courte explication illustrée, ensuite directement la galerie.
 */
export function useCaptureIntro() {
  const db = useSQLiteContext();
  const [seen, setSeen] = useState<boolean | null>(seenCache);

  useEffect(() => {
    if (seenCache !== null) return;
    let alive = true;
    db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [SEEN_KEY])
      .then((row) => {
        seenCache = !!row?.value;
        if (alive) setSeen(seenCache);
      })
      .catch((err) => {
        console.error('Error reading capture intro state:', err);
        if (alive) setSeen(false);
      });
    return () => {
      alive = false;
    };
  }, [db]);

  const markSeen = useCallback(async () => {
    seenCache = true;
    setSeen(true);
    const now = new Date().toISOString();
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
        [SEEN_KEY, now, now]
      );
    } catch (err) {
      console.error('Error writing capture intro state:', err);
    }
  }, [db]);

  return { seen: seen === true, markSeen };
}
