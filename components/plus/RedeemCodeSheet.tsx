import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DialogButtonRow, DialogGhostBtn, DialogPrimaryBtn } from '@/components/ui/DialogButtons';
import { useV2 } from '@/constants/designTokensV2';
import { usePremium } from '@/hooks/premium/usePremium';
import type { License, LicenseError } from '@/lib/premium';
import { formatDay } from './format';

interface RedeemCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: (license: License) => void;
}

/** E7 réduit au lot 0 : coller un code d'activation (jeton long), vérifié hors ligne. */
export function RedeemCodeSheet({ isOpen, onClose, onActivated }: RedeemCodeSheetProps) {
  const v2 = useV2();
  const { t, i18n } = useTranslation();
  const premium = usePremium();
  const [value, setValue] = useState('');
  const [error, setError] = useState<{ reason: LicenseError; expiresOn?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError(null);
    }
  }, [isOpen]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await premium.redeem(value, 'paste');
      if (res.ok) onActivated(res.license);
      else setError({ reason: res.reason, expiresOn: res.license?.expiresOn });
    } finally {
      setBusy(false);
    }
  };

  const ended = premium.storedError?.reason === 'expired' ? premium.storedError.license?.expiresOn : null;
  const errorText = error
    ? error.reason === 'expired' && error.expiresOn
      ? t('plus.redeem.expired', { date: formatDay(error.expiresOn, i18n.language) })
      : t('plus.redeem.invalid')
    : null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      overline={t('plus.name')}
      title={t('plus.redeem.title')}
      footer={
        <DialogButtonRow>
          <DialogGhostBtn label={t('plus.close')} onPress={onClose} />
          <DialogPrimaryBtn label={t('plus.redeem.submit')} onPress={submit} disabled={!value.trim()} isLoading={busy} />
        </DialogButtonRow>
      }
    >
      {ended ? (
        <Text style={{ marginBottom: 12, fontFamily: v2.fontUIRegular, fontSize: 13, lineHeight: 19, color: v2.inkMuted }}>
          {t('plus.ended', { date: formatDay(ended, i18n.language) })}
        </Text>
      ) : null}
      <Text style={{ fontFamily: v2.fontUIRegular, fontSize: 14, lineHeight: 20, color: v2.inkMuted }}>
        {t('plus.redeem.body')}
      </Text>
      <View
        style={{
          marginTop: 14, borderRadius: 12, borderWidth: 1, backgroundColor: v2.bgBase,
          borderColor: error ? v2.bad : v2.hairlineStrong, paddingHorizontal: 12, paddingVertical: 10,
        }}
      >
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            setError(null);
          }}
          placeholder={t('plus.redeem.placeholder')}
          placeholderTextColor={v2.inkSubtle}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          accessibilityLabel={t('plus.redeem.title')}
          style={{ minHeight: 64, fontFamily: v2.fontUI, fontSize: 13, color: v2.ink, padding: 0, textAlignVertical: 'top' }}
        />
      </View>
      {errorText ? (
        <Text accessibilityLiveRegion="polite" style={{ marginTop: 8, fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>
          {errorText}
        </Text>
      ) : null}
    </BottomSheet>
  );
}
