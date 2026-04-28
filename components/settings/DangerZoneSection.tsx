import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SectionLabel, SettingsCard, SettingsRow } from '@/components/settings/v2';

interface DangerZoneSectionProps {
  onReset: () => void;
}

export function DangerZoneSection({ onReset }: DangerZoneSectionProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  return (
    <>
      <SectionLabel>{t('settingsV2.dangerZoneSection')}</SectionLabel>
      <SettingsCard danger>
        <SettingsRow
          icon="trash-outline"
          iconColor={v2.bad}
          label={t('settingsV2.resetAppLabel')}
          sublabel={t('settingsV2.resetAppSub')}
          danger
          isLast
          onPress={onReset}
        />
      </SettingsCard>
    </>
  );
}
