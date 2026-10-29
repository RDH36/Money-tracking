import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsRow } from '@/components/settings/v2';
import { usePremium } from '@/hooks/premium/usePremium';
import type { License } from '@/lib/premium';
import { formatDay } from './format';
import { PlusActivatedDialog } from './PlusActivatedDialog';
import { RedeemCodeSheet } from './RedeemCodeSheet';

/** E11 réduit au lot 0 : état de Mitsitsy Plus ; la ligne ouvre « Saisir un code » (sous-titre seulement en gratuit). */
export function PlusSettingsRow() {
  const { t, i18n } = useTranslation();
  const { license } = usePremium();
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState<License | null>(null);

  const value = !license
    ? t('plus.status.free')
    : license.expiresOn
      ? t('plus.status.activeUntil', { date: formatDay(license.expiresOn, i18n.language) })
      : t('plus.status.lifetime');

  return (
    <>
      <SettingsRow
        icon="key-outline"
        iconColor="#0E8C82"
        label={t('plus.name')}
        sublabel={license ? undefined : t('plus.enterCode')}
        value={value}
        onPress={() => setOpen(true)}
      />
      <RedeemCodeSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        onActivated={(l) => {
          setOpen(false);
          setActivated(l);
        }}
      />
      <PlusActivatedDialog license={activated} onClose={() => setActivated(null)} />
    </>
  );
}
