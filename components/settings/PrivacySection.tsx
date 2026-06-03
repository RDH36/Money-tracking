import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { SectionLabel, SettingsCard, SettingsRow, SettingsToggle } from '@/components/settings/v2';

interface PrivacySectionProps {
  balanceHidden: boolean;
  onToggle: () => void;
  appLockEnabled: boolean;
  onToggleAppLock: () => void;
  appLockBiometric: boolean;
  onToggleBiometric: () => void;
  biometricAvailable: boolean;
  onChangePin: () => void;
  appLockUnavailable?: boolean;
}

export function PrivacySection({
  balanceHidden,
  onToggle,
  appLockEnabled,
  onToggleAppLock,
  appLockBiometric,
  onToggleBiometric,
  biometricAvailable,
  onChangePin,
  appLockUnavailable,
}: PrivacySectionProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View>
      <View
        style={{
          backgroundColor: v2.bgSurface,
          borderWidth: 1,
          borderColor: v2.hairline,
          borderRadius: 14,
          padding: 20,
        }}
      >
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '600',
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: v2.inkSubtle, marginBottom: 8,
          }}
        >
          {t('privacyV2.previewLabel')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700', fontSize: 38,
              color: v2.ink, letterSpacing: -1, lineHeight: 40,
              fontVariant: ['tabular-nums'],
              opacity: balanceHidden ? 0.25 : 1,
            }}
          >
            {balanceHidden ? '••••••' : '1 036 500'}
          </Text>
          <Text style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.inkSubtle }}>Ar</Text>
        </View>
        {balanceHidden ? (
          <View
            style={{
              alignSelf: 'flex-start', marginTop: 14,
              paddingVertical: 8, paddingHorizontal: 12,
              borderRadius: 10, backgroundColor: v2.bgRaised,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, fontWeight: '600', color: v2.inkMuted }}>
              {t('privacyV2.balanceMaskedHint')}
            </Text>
          </View>
        ) : null}
      </View>

      <SectionLabel>{t('privacyV2.displaySection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="eye-off-outline"
          iconColor="#6366F1"
          label={t('privacyV2.hideByDefault')}
          sublabel={t('privacyV2.hideByDefaultSub')}
          right={<SettingsToggle value={balanceHidden} onChange={onToggle} />}
          isLast
        />
      </SettingsCard>

      <SectionLabel>{t('privacyV2.securitySection')}</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="keypad-outline"
          iconColor="#14B8A6"
          label={t('privacyV2.appLock')}
          sublabel={t('privacyV2.appLockSub')}
          right={<SettingsToggle value={appLockEnabled} onChange={onToggleAppLock} />}
          isLast={!appLockEnabled}
        />
        {appLockEnabled ? (
          <SettingsRow
            icon="ellipsis-horizontal"
            iconColor="#6366F1"
            label={t('privacyV2.changePin')}
            sublabel={t('privacyV2.changePinSub')}
            onPress={onChangePin}
            isLast={!biometricAvailable}
          />
        ) : null}
        {appLockEnabled && biometricAvailable ? (
          <SettingsRow
            icon="finger-print"
            iconColor="#F59E0B"
            label={t('privacyV2.biometricUnlock')}
            sublabel={t('privacyV2.biometricUnlockSub')}
            right={<SettingsToggle value={appLockBiometric} onChange={onToggleBiometric} />}
            isLast
          />
        ) : null}
      </SettingsCard>
      {appLockUnavailable ? (
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 12, color: v2.bad,
            marginTop: 8, marginHorizontal: 4, lineHeight: 17,
          }}
        >
          {t('privacyV2.faceIdUnavailable')}
        </Text>
      ) : null}
    </View>
  );
}
