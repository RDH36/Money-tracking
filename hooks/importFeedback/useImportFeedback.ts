import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import { APP_VERSION, PROJECT_NAME } from '@/constants/app';
import { useCurrency, useReminderFrequency } from '@/stores/settingsStore';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import {
  FEEDBACK_KEYS, IMPORT_SURVEY_KEY, buildSurveyPayload, queueSurvey, validateSurvey, writeFeedbackSetting,
  type SurveyError, type SurveyForm,
} from '@/lib/importFeedback';
import { flushPendingSurvey, hydrateImportFeedback, syncBetaReminder } from './services';
import { useImportFeedbackStore } from './store';

export type SubmitOutcome =
  | { ok: true; sent: boolean; draw: boolean }
  | { ok: false; error: SurveyError | 'save' };

/** Textes affichés au moment de la réponse (preuve lisible côté back-office). */
export interface SurveyLabels {
  question: string;
  answer: string;
  consentText: string;
}

/**
 * Programme « Testeur bêta » : état (avis envoyé, « Plus tard »), et les deux
 * actions du sondage. L'avis est d'abord gardé en local puis envoyé : hors
 * ligne il part au prochain lancement, et l'utilisateur n'a rien à refaire.
 */
export function useImportFeedback() {
  const db = useSQLiteContext();
  const posthog = usePostHog();
  const currency = useCurrency();
  const frequency = useReminderFrequency();
  const version = useDataRefreshStore((s) => s.transactionsVersion);
  const loaded = useImportFeedbackStore((s) => s.loaded);
  const rewardedAt = useImportFeedbackStore((s) => s.rewardedAt);
  const laterAt = useImportFeedbackStore((s) => s.laterAt);

  useEffect(() => {
    hydrateImportFeedback(db).catch((err) => console.error('Reading import feedback failed:', err));
  }, [db, version]);

  /** « Plus tard » : pas de nouvelle proposition automatique avant 7 jours. */
  const markLater = useCallback(async () => {
    const now = new Date().toISOString();
    useImportFeedbackStore.getState().set({ laterAt: now });
    posthog.capture(`${IMPORT_SURVEY_KEY}_survey_later`);
    try {
      await writeFeedbackSetting(db, FEEDBACK_KEYS.laterAt, now);
    } catch (err) {
      console.error('Saving survey later failed:', err);
    }
  }, [db, posthog]);

  const submit = useCallback(async (form: SurveyForm, labels: SurveyLabels): Promise<SubmitOutcome> => {
    const check = validateSurvey(form);
    if (!check.ok) return check;
    const now = new Date();
    const payload = buildSurveyPayload({
      feeling: form.feeling!, question: labels.question, answer: labels.answer, comment: form.comment,
      email: check.email, consentText: labels.consentText, currency: currency.code,
      appVersion: APP_VERSION, platform: Platform.OS, project: PROJECT_NAME, now,
    });
    try {
      await queueSurvey(db, payload);
      await writeFeedbackSetting(db, FEEDBACK_KEYS.rewardedAt, now.toISOString());
    } catch (err) {
      console.error('Saving import survey failed:', err);
      return { ok: false, error: 'save' };
    }
    useImportFeedbackStore.getState().set({ rewardedAt: now.toISOString() });
    // Jamais l'e-mail ni le commentaire dans l'analytique.
    posthog.capture(`${IMPORT_SURVEY_KEY}_survey_submitted`, {
      feeling: form.feeling, has_comment: form.comment.trim().length > 0, draw_optin: check.email !== null,
      currency: currency.code, app_version: APP_VERSION, project: PROJECT_NAME,
    });
    await syncBetaReminder(db, frequency);
    const sent = (await flushPendingSurvey(db)) === 'sent';
    return { ok: true, sent, draw: check.email !== null };
  }, [db, posthog, currency.code, frequency]);

  return { loaded, answered: !!rewardedAt, rewardedAt, laterAt, markLater, submit };
}
