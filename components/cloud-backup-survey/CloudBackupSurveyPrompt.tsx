import { useState } from 'react';
import { usePostHog } from 'posthog-react-native';
import { useCloudBackupSurvey } from '@/hooks';
import { CloudBackupSurveyBanner } from '@/components/dashboard';
import { CloudBackupSurveyModal } from '@/components/CloudBackupSurveyModal';

/**
 * Bloc autonome pour le dashboard : affiche la bannière du sondage "sauvegarde
 * cloud" tant qu'il n'a pas été répondu/masqué, et pilote la modale du sondage.
 */
export function CloudBackupSurveyPrompt() {
  const posthog = usePostHog();
  const { shouldShow, markAnswered, dismiss } = useCloudBackupSurvey();
  const [showModal, setShowModal] = useState(false);

  if (!shouldShow) return null;

  return (
    <>
      <CloudBackupSurveyBanner
        onPress={() => {
          posthog.capture('cloud_backup_survey_started');
          setShowModal(true);
        }}
        onDismiss={() => {
          posthog.capture('cloud_backup_survey_dismissed');
          dismiss();
        }}
      />
      <CloudBackupSurveyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAnswered={markAnswered}
      />
    </>
  );
}
