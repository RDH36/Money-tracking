import { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, getNumericValue } from '@/lib/amountInput';
import { ProgressDots, EyebrowLabel, PrimaryBtn } from '@/components/onboarding/v2';

interface AccountInputProps {
  label: string;
  hint: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  currencyCode: string;
  amount: string;
  onChange: (s: string) => void;
  italicEmpty?: boolean;
}

function AccountInput({
  label, hint, iconName, iconBg, iconColor,
  currencyCode, amount, onChange, italicEmpty,
}: AccountInputProps) {
  const v2 = useV2();
  const isEmpty = !amount;
  return (
    <View
      style={{
        padding: 16, backgroundColor: v2.bgSurface,
        borderWidth: 1, borderColor: v2.hairline,
        borderRadius: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View
          style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 16, color: v2.ink, letterSpacing: -0.2,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle, marginTop: 1,
            }}
          >
            {hint}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
            letterSpacing: 0.6, color: v2.inkSubtle,
          }}
        >
          {currencyCode}
        </Text>
      </View>
      <View
        style={{
          paddingVertical: 14, paddingHorizontal: 14,
          backgroundColor: v2.bgRaised, borderRadius: 12,
          flexDirection: 'row', alignItems: 'baseline', gap: 8,
        }}
      >
        <TextInput
          placeholder="0"
          placeholderTextColor={v2.inkSubtle}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={onChange}
          style={{
            flex: 1,
            fontFamily: v2.fontDisplay, fontWeight: '700',
            fontStyle: italicEmpty && isEmpty ? 'italic' : 'normal',
            fontSize: 28, color: isEmpty ? v2.inkSubtle : v2.ink,
            letterSpacing: -0.5, padding: 0,
            fontVariant: ['tabular-nums'],
          }}
        />
        <Text
          style={{
            fontFamily: v2.fontUI, fontSize: 13,
            color: v2.inkSubtle, fontWeight: '600',
          }}
        >
          {currencyCode}
        </Text>
      </View>
    </View>
  );
}

export default function BalanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const currency = useCurrency();
  const { t } = useTranslation();
  const [bankBalance, setBankBalance] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    const numericBank = getNumericValue(bankBalance);
    const numericCash = getNumericValue(cashBalance);
    if (numericBank < 0 || numericCash < 0) {
      setError(t('onboarding.negativeError')); return;
    }
    if (numericBank === 0 && numericCash === 0) {
      setError(t('onboarding.balanceRequired')); return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/onboarding/categories' as const,
      params: { bankBalance: bankBalance || '0', cashBalance: cashBalance || '0' },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        bottomOffset={20}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <ProgressDots step={7} />
          <EyebrowLabel>{t('onboarding.configureAccounts')}</EyebrowLabel>
          <Text
            style={{
              marginTop: 4,
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 30, color: v2.ink, letterSpacing: -0.7, lineHeight: 34,
            }}
          >
            {t('onboarding.balanceTitleStart')}{' '}
            <Text style={{ fontStyle: 'italic', color: v2.brand }}>
              {t('onboarding.balanceTitleAccent')}
            </Text>
          </Text>
          <Text
            style={{
              marginTop: 10, fontFamily: v2.fontUI, fontSize: 14,
              color: v2.inkMuted, lineHeight: 20,
            }}
          >
            {t('onboarding.balanceSubtitle')}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <AccountInput
            label={t('account.bank')}
            hint={t('onboarding.bankAccount')}
            iconName="card-outline"
            iconBg={v2.brandSoft}
            iconColor={v2.brand}
            currencyCode={currency.code}
            amount={bankBalance}
            onChange={(s) => { setBankBalance(formatAmountInput(s)); if (error) setError(''); }}
          />
          <AccountInput
            label={t('account.cash')}
            hint={t('onboarding.cashAccount')}
            iconName="cash-outline"
            iconBg={v2.bad + '22'}
            iconColor={v2.bad}
            currencyCode={currency.code}
            amount={cashBalance}
            onChange={(s) => { setCashBalance(formatAmountInput(s)); if (error) setError(''); }}
            italicEmpty
          />

          <View
            style={{
              padding: 12, borderRadius: 12,
              backgroundColor: v2.brandSoft,
              flexDirection: 'row', alignItems: 'flex-start', gap: 10,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={14} color={v2.brand} style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1, fontFamily: v2.fontUI, fontSize: 11,
                color: v2.brandDeep, lineHeight: 16,
              }}
            >
              {t('onboarding.balanceChangeHint')}
            </Text>
          </View>

          {error ? (
            <Text style={{ fontFamily: v2.fontUI, fontSize: 12, color: v2.bad }}>
              {error}
            </Text>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <PrimaryBtn label={t('onboarding.next')} onPress={handleNext} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
