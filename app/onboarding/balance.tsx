import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, getNumericValue } from '@/lib/amountInput';
import { usePostHog } from 'posthog-react-native';
import { useOnboarding } from '@/hooks';
import { getDefaultOnboardingCategoryIds } from '@/constants/categories';
import { ProgressDots, EyebrowLabel } from '@/components/onboarding/v2';
import { AccountInput } from '@/components/onboarding/v2/AccountInput';
import { BalanceFooter } from '@/components/onboarding/v2/BalanceFooter';

export default function BalanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const v2 = useV2();
  const currency = useCurrency();
  const { t } = useTranslation();
  const [bankBalance, setBankBalance] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [error, setError] = useState('');

  const { saveOnboardingData, isLoading } = useOnboarding();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('onboarding_balance_viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dernière étape : enregistre comptes + catégories cochées d'office
  // (ex-écran catégories) puis ouvre la 1re dépense.
  const finish = async (skipped: boolean) => {
    const selectedCategories = getDefaultOnboardingCategoryIds();
    const ok = await saveOnboardingData({
      bankBalance: skipped ? '0' : bankBalance || '0',
      cashBalance: skipped ? '0' : cashBalance || '0',
      selectedCategories,
    });
    if (ok) {
      posthog.capture('onboarding_completed', {
        categories_selected: selectedCategories.size,
        balance_skipped: skipped,
      });
      router.replace('/add?source=onboarding');
    }
  };

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finish(false);
  };

  const handleLater = () => {
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    posthog.capture('onboarding_balance_skipped');
    finish(true);
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
          <EyebrowLabel>{t('onboarding.lastStep')}</EyebrowLabel>
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

        <BalanceFooter loading={isLoading} onFinish={handleNext} onLater={handleLater} />
      </KeyboardAwareScrollView>
    </View>
  );
}
