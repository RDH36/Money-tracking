import { useState } from 'react';
import { Platform } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_VERSION, PROJECT_NAME } from '@/constants/app';
import { checkInternetConnection } from '@/lib/network';

export interface SubmitArgs {
  /** Objet stocké dans la colonne jsonb `response` (items lisibles + commentaire). */
  response: Record<string, unknown>;
  /** Email du répondant → colonne dédiée (recontact / filtre). */
  email: string | null;
  currency: string;
  /** Propriétés brutes pour l'event PostHog (analyse / breakdowns). */
  tracking: Record<string, string | null>;
}

/**
 * Envoie les réponses d'un sondage vers la table générique `feature_surveys`.
 * `response` (jsonb) contient une version LISIBLE (question + réponse) pour le
 * back-office ; les valeurs brutes partent dans l'event PostHog (`tracking`).
 */
export function useSurveySubmit(surveyKey: string) {
  const posthog = usePostHog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async ({ response, email, currency, tracking }: SubmitArgs): Promise<boolean> => {
    if (isSubmitting) return false;
    setIsSubmitting(true);
    setError(null);

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setError('noInternet');
      setIsSubmitting(false);
      return false;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feature_surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          survey_key: surveyKey,
          response,
          currency,
          email,
          app_version: APP_VERSION,
          device_platform: Platform.OS,
          project: PROJECT_NAME,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit survey');
      posthog.capture(`${surveyKey}_survey_submitted`, {
        ...tracking, currency, app_version: APP_VERSION, project: PROJECT_NAME,
      });
      return true;
    } catch {
      setError('submit');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, setError };
}
