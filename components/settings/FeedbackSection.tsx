import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingRow } from './SettingRow';
import { SettingSection } from './SettingSection';
import { FeedbackModal } from '@/components/FeedbackModal';

export function FeedbackSection() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <SettingSection title={t('settings.feedback')}>
        <SettingRow
          label={t('settings.reportProblem')}
          onPress={() => setShowModal(true)}
          isLast
        />
      </SettingSection>

      <FeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
