import { useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SettingRow } from './SettingRow';
import { SettingSection } from './SettingSection';
import { FeedbackModal } from '@/components/FeedbackModal';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.rdh36.mitsitsy';

export function FeedbackSection() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <SettingSection title={t('settings.feedback')}>
        <SettingRow
          label={t('settings.reportProblem')}
          onPress={() => setShowModal(true)}
        />
        <SettingRow
          label={t('settings.rateApp')}
          onPress={() => Linking.openURL(PLAY_STORE_URL)}
          external
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
