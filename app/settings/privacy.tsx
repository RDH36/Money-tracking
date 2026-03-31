import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useSettings } from '@/hooks';
import { PrivacySection } from '@/components/settings';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';

export default function PrivacySettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const { balanceHidden, toggleBalanceVisibility } = useSettings();

  return (
    <SettingsPageWrapper title={t('settings.privacy')}>
      <PrivacySection
        balanceHidden={balanceHidden}
        onToggle={() => {
          posthog.capture('balance_visibility_toggled', { hidden: !balanceHidden });
          toggleBalanceVisibility();
        }}
      />
    </SettingsPageWrapper>
  );
}
