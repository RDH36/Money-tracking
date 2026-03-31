import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeedbackSection } from '@/components/settings';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';

export default function FeedbackSettingsPage() {
  const { t } = useTranslation();

  return (
    <SettingsPageWrapper title={t('settings.feedback')}>
      <FeedbackSection />
    </SettingsPageWrapper>
  );
}
