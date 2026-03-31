import { useTranslation } from 'react-i18next';
import { LanguageSection } from '@/components/settings';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';

export default function LanguageSettingsPage() {
  const { t } = useTranslation();

  return (
    <SettingsPageWrapper title={t('settings.language')}>
      <LanguageSection />
    </SettingsPageWrapper>
  );
}
