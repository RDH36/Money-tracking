import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '@/constants/app';
import { SectionLabel, SettingsCard, SettingsRow } from '@/components/settings/v2';

const openLink = (url: string) => Linking.openURL(url);

export function AboutSection() {
  const { t } = useTranslation();
  return (
    <>
      <SectionLabel>{t('settings.about')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="information-circle-outline"
          label="Mitsitsy"
          sublabel={`Version ${APP_VERSION}`}
          right={null}
        />
        <SettingsRow
          icon="person-circle-outline"
          label={t('settings.developer')}
          value="Raymond Dzery Hago"
          onPress={() => openLink('https://www.facebook.com/rdh36')}
        />
        <SettingsRow
          icon="document-text-outline"
          label={t('settings.termsOfUse') ?? t('settingsV2.termsOfUse')}
          onPress={() => openLink('https://www.mitsitsy.app/terms')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label={t('settings.privacyPolicy') ?? t('settingsV2.privacyPolicy')}
          onPress={() => openLink('https://www.mitsitsy.app/privacy')}
          isLast
        />
      </SettingsCard>
    </>
  );
}
