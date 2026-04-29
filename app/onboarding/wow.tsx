import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { usePostHog } from 'posthog-react-native';
import { useV2 } from '@/constants/designTokensV2';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';
import { formatCurrency } from '@/lib/currency';
import { useSettings } from '@/hooks';
import { ConfettiEffect } from '@/components/onboarding/ConfettiEffect';
import { ProgressDots, EyebrowLabel } from '@/components/onboarding/v2';
import { CurrencyPicker, ExpenseTapList, ReportSheet, type TapExpense } from '@/components/onboarding/v2/wow';

const AMOUNTS: Record<string, { expenses: number[]; balance: number }> = {
  MGA: { expenses: [15000, 8000, 25000, 12000], balance: 1000000 },
  EUR: { expenses: [3.5, 12, 15, 8], balance: 500 },
  USD: { expenses: [3.5, 12, 15, 8], balance: 500 },
};

const TEMPLATES: Omit<TapExpense, 'amount'>[] = [
  { id: 'coffee', label: 'wow.expenseCoffee', icon: 'cafe-outline', category: 'wow.catFood', color: '#C8442C' },
  { id: 'taxi', label: 'wow.expenseTaxi', icon: 'car-outline', category: 'wow.catTransport', color: '#3D7BB6' },
  { id: 'lunch', label: 'wow.expenseLunch', icon: 'restaurant-outline', category: 'wow.catFood', color: '#C8442C' },
  { id: 'phone', label: 'wow.expensePhone', icon: 'phone-portrait-outline', category: 'wow.catBills', color: '#7B5EA8' },
];

export default function WowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const v2 = useV2();
  const { setCurrency } = useSettings();
  const posthog = usePostHog();

  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const balanceAnim = useSharedValue(1);
  const overlayOpacity = useSharedValue(0);
  const reportOpacity = useSharedValue(0);
  const reportTy = useSharedValue(600);

  const amounts = AMOUNTS[selectedCurrency] || AMOUNTS.USD;
  const expenses: TapExpense[] = TEMPLATES.map((tpl, i) => ({
    ...tpl,
    label: t(tpl.label),
    category: t(tpl.category),
    amount: amounts.expenses[i],
  }));

  const spent = expenses.filter((e) => tapped.has(e.id)).reduce((s, e) => s + e.amount, 0);
  const balance = amounts.balance - spent;
  const allTapped = tapped.size === expenses.length;
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const breakdown = expenses.reduce<Record<string, { amount: number; color: string; key: string }>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = { amount: 0, color: e.color, key: e.category };
    acc[e.category].amount += e.amount;
    return acc;
  }, {});
  const categoriesArr = Object.values(breakdown).map((b) => ({
    key: b.key, label: b.key, amount: b.amount, color: b.color,
    pct: total > 0 ? (b.amount / total) * 100 : 0,
  }));

  const handleSelectCurrency = useCallback(async (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCurrency(code);
    await setCurrency(code);
  }, [setCurrency]);

  const handleTap = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = new Set(tapped); next.add(id);
    setTapped(next);
    balanceAnim.value = withSpring(1.06, { damping: 6, stiffness: 220 }, () => {
      balanceAnim.value = withSpring(1, { damping: 8, stiffness: 200 });
    });

    if (next.size === expenses.length) {
      posthog.capture('wow_moment_completed', { currency: selectedCurrency });
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        overlayOpacity.value = withTiming(1, { duration: 300 });
        reportOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
        reportTy.value = withDelay(200, withTiming(0, {
          duration: 500, easing: Easing.out(Easing.cubic),
        }));
      }, 300);
    }
  }, [tapped, expenses.length, selectedCurrency]);

  const balanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: balanceAnim.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const reportStyle = useAnimatedStyle(() => ({
    opacity: reportOpacity.value,
    transform: [{ translateY: reportTy.value }],
  }));

  const fmt = (n: number) => formatCurrency(n, selectedCurrency);

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <ProgressDots step={7} />
          <EyebrowLabel>{t('wow.subtitle')}</EyebrowLabel>
          <Text
            style={{
              fontFamily: v2.fontDisplay, fontWeight: '700',
              fontSize: 26, color: v2.ink, letterSpacing: -0.5, lineHeight: 30,
            }}
          >
            {t('wow.title')}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <CurrencyPicker
            options={CURRENCIES.map((c) => ({ code: c.code, symbol: c.symbol }))}
            selected={selectedCurrency}
            onSelect={handleSelectCurrency}
            label={t('onboarding.currencyLabel')}
          />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <View
            style={{
              padding: 18, borderRadius: 18,
              backgroundColor: v2.brandSoft,
              borderWidth: 1, borderColor: v2.brand + '30',
            }}
          >
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: v2.brand, marginBottom: 4,
              }}
            >
              {t('wow.balance')}
            </Text>
            <Animated.Text
              style={[balanceStyle, {
                fontFamily: v2.fontDisplay, fontWeight: '700',
                fontSize: 36, color: v2.brandDeep, letterSpacing: -1, lineHeight: 38,
                fontVariant: ['tabular-nums'], transformOrigin: 'left',
              }]}
            >
              {fmt(balance)}
            </Animated.Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <ExpenseTapList
            expenses={expenses}
            tapped={tapped}
            onTap={handleTap}
            fmt={fmt}
            label={t('wow.tapToAdd')}
          />
        </View>

        <Text
          style={{
            textAlign: 'center', marginTop: 14, paddingHorizontal: 20,
            fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle,
            fontStyle: 'italic',
          }}
        >
          {tapped.size}/{expenses.length}
        </Text>
      </ScrollView>

      {allTapped && (
        <ReportSheet
          categories={categoriesArr}
          total={total}
          fmt={fmt}
          reportTitle={t('wow.reportTitle')}
          totalLabel={t('wow.reportTotal')}
          successMessage={t('wow.successMessage')}
          ctaLabel={t('wow.cta')}
          bubbleSpeech={t('wow.bubuleCongrats')}
          onCta={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/balance');
          }}
          insets={{ bottom: insets.bottom }}
          overlayStyle={overlayStyle}
          reportStyle={reportStyle}
        />
      )}

      {showConfetti && <ConfettiEffect trigger={showConfetti} />}
    </View>
  );
}
