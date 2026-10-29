import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';
import { PLUS_ENABLED } from '@/constants/app';
import { CenterDialog } from '@/components/ui/CenterDialog';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { PlusActivatedDialog, formatDay } from '@/components/plus';
import { usePremium } from '@/hooks/premium/usePremium';
import { usePremiumStore } from '@/stores/premiumStore';
import type { License, LicenseError } from '@/lib/premium';

/** Confirmation du lien profond `moneytracking://plus/activate?l=…` (jeton mis de côté par +native-intent). */
export default function PlusActivateScreen() {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const premium = usePremium();
  const [token] = useState(() => usePremiumStore.getState().pendingLink);
  const [error, setError] = useState<{ reason: LicenseError; expiresOn?: string | null } | null>(null);
  const [activated, setActivated] = useState<License | null>(null);
  const [busy, setBusy] = useState(false);

  if (!PLUS_ENABLED) return <Redirect href="/" />;

  const leave = () => {
    usePremiumStore.getState().setPendingLink(null);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const res = await premium.redeem(token ?? '', 'link');
      if (res.ok) setActivated(res.license);
      else setError({ reason: res.reason, expiresOn: res.license?.expiresOn });
    } finally {
      setBusy(false);
    }
  };

  const body = error
    ? error.reason === 'expired' && error.expiresOn
      ? t('plus.redeem.expired', { date: formatDay(error.expiresOn, i18n.language) })
      : t('plus.redeem.invalid')
    : t('plus.link.body');

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase }}>
      <CenterDialog
        isOpen={activated === null}
        onClose={leave}
        variant={error ? 'warning' : 'neutral'}
        iconName={error ? 'alert-circle-outline' : 'key-outline'}
        title={t('plus.link.title')}
        body={body}
        footer={
          error ? (
            <DialogPrimaryBtn label={t('plus.close')} onPress={leave} />
          ) : (
            <DialogButtonRow>
              <DialogGhostBtn label={t('plus.link.cancel')} onPress={leave} />
              <DialogPrimaryBtn label={t('plus.link.confirm')} onPress={confirm} isLoading={busy} />
            </DialogButtonRow>
          )
        }
      />
      <PlusActivatedDialog license={activated} onClose={leave} />
    </View>
  );
}
