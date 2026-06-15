import { useState } from 'react';
import { Platform } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_VERSION, PROJECT_NAME } from '@/constants/app';
import { checkInternetConnection } from '@/lib/network';

export type SurveyResponse = Record<string, string | null>;

/**
 * Envoie les réponses d'un sondage de feature vers la table GÉNÉRIQUE
 * `feature_surveys` (Supabase), identifiée par `surveyKey`. Même mécanique que
 * le feedback. Réutilisable tel quel pour de futurs sondages (response jsonb).
 */
export function useSurveySubmit(surveyKey: string) {
  const posthog = usePostHog();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (response: SurveyResponse, currency: string): Promise<boolean> => {
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
          app_version: APP_VERSION,
          device_platform: Platform.OS,
          project: PROJECT_NAME,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit survey');
      posthog.capture(`${surveyKey}_survey_submitted`, {
        ...response, currency, app_version: APP_VERSION, project: PROJECT_NAME,
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
