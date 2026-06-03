import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import { useSettings } from '@/hooks';
import { PrivacySection } from '@/components/settings';
import { SettingsPageWrapper } from '@/components/settings/SettingsPageWrapper';
import { SetPinScreen } from '@/components/lock';
import { isBiometricAvailable, setPin } from '@/lib/appLock';

export default function PrivacySettingsPage() {
  const { t } = useTranslation();
  const posthog = usePostHog();
  const {
    balanceHidden,
    toggleBalanceVisibility,
    appLockEnabled,
    setAppLockEnabled,
    appLockBiometric,
    setAppLockBiometric,
  } = useSettings();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinSetup, setPinSetup] = useState(false);
  const [requireOld, setRequireOld] = useState(false);
  const [appLockUnavailable, setAppLockUnavailable] = useState(false);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const handleToggleAppLock = () => {
    if (appLockEnabled) {
      setAppLockEnabled(false);
      posthog.capture('app_lock_toggled', { enabled: false });
    } else {
      setRequireOld(false);
      setPinSetup(true);
    }
  };

  const handleChangePin = () => {
    setRequireOld(true);
    setPinSetup(true);
  };

  const handlePinDone = async (pin: string) => {
    try {
      await setPin(pin);
    } catch {
      setAppLockUnavailable(true);
      setPinSetup(false);
      return;
    }
    if (!appLockEnabled) {
      await setAppLockEnabled(true);
      if (biometricAvailable) await setAppLockBiometric(true);
      posthog.capture('app_lock_toggled', { enabled: true });
    } else {
      posthog.capture('app_lock_pin_changed');
    }
    setPinSetup(false);
  };

  const handleToggleBiometric = async () => {
    const result = await setAppLockBiometric(!appLockBiometric);
    if (!result.success) {
      setAppLockUnavailable(true);
      return;
    }
    setAppLockUnavailable(false);
  };

  if (pinSetup) {
    return (
      <SetPinScreen
        requireOld={requireOld}
        onDone={handlePinDone}
        onCancel={() => setPinSetup(false)}
      />
    );
  }

  return (
    <SettingsPageWrapper title={t('settings.privacy')}>
      <PrivacySection
        balanceHidden={balanceHidden}
        onToggle={() => {
          posthog.capture('balance_visibility_toggled', { hidden: !balanceHidden });
          toggleBalanceVisibility();
        }}
        appLockEnabled={appLockEnabled}
        onToggleAppLock={handleToggleAppLock}
        appLockBiometric={appLockBiometric}
        onToggleBiometric={handleToggleBiometric}
        biometricAvailable={biometricAvailable}
        onChangePin={handleChangePin}
        appLockUnavailable={appLockUnavailable}
      />
    </SettingsPageWrapper>
  );
}
