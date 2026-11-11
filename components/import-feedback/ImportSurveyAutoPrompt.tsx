import { useEffect, useRef, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { useReminderFrequency } from '@/stores/settingsStore';
import { useImportFeedback } from '@/hooks/importFeedback/useImportFeedback';
import { markFirstRead, syncBetaReminder } from '@/hooks/importFeedback/services';
import { shouldAutoPrompt } from '@/lib/importFeedback';
import { ImportSurveySheet } from './ImportSurveySheet';

interface ImportSurveyAutoPromptProps {
  loaded: boolean;
  unlimited: boolean;
  /** Lectures du cycle : monte juste après un enregistrement d'import. */
  used: number;
  limit: number;
}

/** Laisse l'écran « C'est enregistré » apparaître avant la feuille. */
const OPEN_DELAY_MS = 600;

/**
 * Monté dans l'écran d'import. Quand le compteur de lectures monte : note la
 * première lecture (rappel J+2) et, si le quota du cycle vient d'être atteint,
 * propose le sondage une fois.
 */
export function ImportSurveyAutoPrompt({ loaded, unlimited, used, limit }: ImportSurveyAutoPromptProps) {
  const db = useSQLiteContext();
  const frequency = useReminderFrequency();
  const feedback = useImportFeedback();
  const prev = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const ready = loaded && feedback.loaded;

  useEffect(() => {
    if (!ready) return;
    const before = prev.current;
    prev.current = used;
    if (before === null || used <= before || unlimited) return;
    markFirstRead(db)
      .then(() => syncBetaReminder(db, frequency))
      .catch((err) => console.error('Marking first import read failed:', err));
    const prompt = shouldAutoPrompt({
      prevUsed: before, used, limit, unlimited, answered: feedback.answered, laterAt: feedback.laterAt, now: new Date(),
    });
    if (!prompt) return;
    const id = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, used]);

  return <ImportSurveySheet isOpen={open} onClose={() => setOpen(false)} trigger="auto" />;
}
