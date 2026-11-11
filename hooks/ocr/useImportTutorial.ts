import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { TUTORIAL_SEEN_KEY, shouldAutoPlayTutorial } from '@/lib/ocr/tutorial';

// Cache de session : la carte d'import est remontée à chaque visite de « + ».
let seenCache: boolean | null = null;

/**
 * Tuto vidéo de l'import : lancé une seule fois, à la première ouverture de
 * l'import. Le drapeau est écrit dès l'affichage (jamais de boucle, même si
 * l'app est tuée pendant la vidéo).
 */
export function useImportTutorial() {
  const db = useSQLiteContext();
  const [seen, setSeen] = useState<boolean | null>(seenCache);

  useEffect(() => {
    if (seenCache !== null) return;
    let alive = true;
    db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [TUTORIAL_SEEN_KEY])
      .then((row) => {
        // Un affichage a pu poser le drapeau pendant la lecture : il gagne.
        if (seenCache === null) seenCache = !!row?.value;
        if (alive) setSeen(seenCache);
      })
      .catch((err) => {
        // Lecture impossible : pas de tuto automatique (le bouton reste là).
        console.error('Error reading import tutorial state:', err);
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
        [TUTORIAL_SEEN_KEY, now, now]
      );
    } catch (err) {
      console.error('Error writing import tutorial state:', err);
    }
  }, [db]);

  return { shouldAutoPlay: shouldAutoPlayTutorial(seen), markSeen };
}
