import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { ConfettiEffect } from '@/components/onboarding/ConfettiEffect';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { useCurrency } from '@/stores/settingsStore';
import { formatCurrency } from '@/lib/currency';
import { PressableScale } from '@/components/onboarding/PressableScale';
import { usePostHog } from 'posthog-react-native';

// Amounts in cents, scaled per currency
const AMOUNTS: Record<string, { expenses: number[]; balance: number }> = {
  MGA: { expenses: [300000, 500000, 800000, 1500000], balance: 10000000 },
  EUR: { expenses: [350, 1200, 1500, 2500], balance: 50000 },
  USD: { expenses: [350, 1200, 1500, 2500], balance: 50000 },
};

const EXPENSE_TEMPLATES = [
  { id: 'coffee', labelKey: 'wow.expenseCoffee', icon: 'cafe' as const, categoryKey: 'wow.catFood', color: '#FF6B6B' },
  { id: 'taxi', labelKey: 'wow.expenseTaxi', icon: 'car' as const, categoryKey: 'wow.catTransport', color: '#4ECDC4' },
  { id: 'lunch', labelKey: 'wow.expenseLunch', icon: 'restaurant' as const, categoryKey: 'wow.catFood', color: '#FF6B6B' },
  { id: 'phone', labelKey: 'wow.expensePhone', icon: 'phone-portrait' as const, categoryKey: 'wow.catBills', color: '#A78BFA' },
];

export default function WowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const colors = getDarkModeColors(isDark);

  const currency = useCurrency();
  const posthog = usePostHog();
  const currencyAmounts = AMOUNTS[currency.code] || AMOUNTS.USD;
  const expenses = EXPENSE_TEMPLATES.map((tpl, i) => ({ ...tpl, amount: currencyAmounts.expenses[i] }));

  const [tappedExpenses, setTappedExpenses] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const balanceAnim = useSharedValue(1);
  const reportOpacity = useSharedValue(0);
  const reportTranslateY = useSharedValue(30);

  const currentBalance = currencyAmounts.balance - expenses
    .filter(e => tappedExpenses.has(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  const allTapped = tappedExpenses.size === expenses.length;

  const handleTapExpense = useCallback((expense: typeof expenses[0]) => {
    if (tappedExpenses.has(expense.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newTapped = new Set(tappedExpenses);
    newTapped.add(expense.id);
    setTappedExpenses(newTapped);

    // Bounce the balance
    balanceAnim.value = withSpring(1, { damping: 4, stiffness: 200 });

    // Check if all done
    if (newTapped.size === expenses.length) {
      posthog.capture('wow_moment_completed', {
        currency: currency.code,
        expenses_tapped: newTapped.size,
      });
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        reportOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
        reportTranslateY.value = withDelay(200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
      }, 300);
    }
  }, [tappedExpenses, expenses.length]);

  const balanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceAnim.value }],
  }));

  const fmt = (amountInCents: number) => formatCurrency(amountInCents, currency.code);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Category breakdown for mini report
  const categoryBreakdown = expenses.reduce<Record<string, { amount: number; color: string; categoryKey: string }>>((acc, e) => {
    const cat = e.categoryKey;
    if (!acc[cat]) acc[cat] = { amount: 0, color: e.color, categoryKey: cat };
    acc[cat].amount += e.amount;
    return acc;
  }, {});

  const reportStyle = useAnimatedStyle(() => ({
    opacity: reportOpacity.value,
    transform: [{ translateY: reportTranslateY.value }],
  }));

  return (
    <View
      className="flex-1 bg-background-0"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <Box className="flex-1 p-6">
        <ProgressBar step={7} totalSteps={9} />

        <VStack space="md" className="mb-6">
          <Heading size="xl" className="text-typography-900">
            {t('wow.title')}
          </Heading>
          <Text className="text-typography-600">
            {t('wow.subtitle')}
          </Text>
        </VStack>

        {/* Balance card */}
        <Box
          className="p-5 rounded-2xl mb-6"
          style={{ backgroundColor: theme.colors.primary + '15' }}
        >
          <Text className="text-sm text-typography-500 mb-1">{t('wow.balance')}</Text>
          <Animated.View style={balanceStyle}>
            <Text
              className="text-3xl font-bold"
              style={{ color: theme.colors.primary }}
            >
              {fmt(currentBalance)}
            </Text>
          </Animated.View>
        </Box>

        {/* Expense list */}
        <VStack space="sm" className="flex-1">
          <Text className="text-sm font-semibold text-typography-500 mb-2">
            {t('wow.tapToAdd')}
          </Text>
          {expenses.map((expense) => {
            const isTapped = tappedExpenses.has(expense.id);
            return (
              <PressableScale
                key={expense.id}
                onPress={() => handleTapExpense(expense)}
                disabled={isTapped}
                haptic="none"
                scaleValue={0.96}
              >
                <HStack
                  className="p-4 rounded-xl border-2"
                  style={{
                    backgroundColor: isTapped ? colors.chipBg : colors.cardBg,
                    borderColor: isTapped ? 'transparent' : colors.cardBorder,
                    opacity: isTapped ? 0.6 : 1,
                  }}
                  space="md"
                >
                  <Box
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: expense.color + '20' }}
                  >
                    <Ionicons name={expense.icon} size={20} color={expense.color} />
                  </Box>
                  <VStack className="flex-1">
                    <Text className="font-semibold text-typography-900">
                      {t(expense.labelKey)}
                    </Text>
                    <Text className="text-xs text-typography-500">
                      {t(expense.categoryKey)}
                    </Text>
                  </VStack>
                  <Text
                    className="font-bold"
                    style={{ color: isTapped ? colors.textMuted : '#FF3B30' }}
                  >
                    -{fmt(expense.amount)}
                  </Text>
                  {isTapped && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </HStack>
              </PressableScale>
            );
          })}
        </VStack>

        {/* Mini report */}
        {allTapped && (
          <Animated.View style={reportStyle}>
            <Box
              className="p-4 rounded-2xl mb-4"
              style={{ backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <HStack className="items-center mb-3" space="sm">
                <Ionicons name="bar-chart" size={18} color={theme.colors.primary} />
                <Text className="font-bold text-typography-900">{t('wow.reportTitle')}</Text>
              </HStack>

              {/* Category bars */}
              <VStack space="sm">
                {Object.values(categoryBreakdown).map((cat) => {
                  const pct = (cat.amount / totalSpent) * 100;
                  return (
                    <VStack key={cat.categoryKey} space="xs">
                      <HStack className="justify-between">
                        <Text className="text-sm text-typography-700">{t(cat.categoryKey)}</Text>
                        <Text className="text-sm font-semibold text-typography-900">{fmt(cat.amount)}</Text>
                      </HStack>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }}>
                        <View
                          style={{
                            height: '100%',
                            borderRadius: 3,
                            backgroundColor: cat.color,
                            width: `${pct}%`,
                          }}
                        />
                      </View>
                    </VStack>
                  );
                })}
              </VStack>

              {/* Total */}
              <HStack className="justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                <Text className="font-bold text-typography-900">{t('wow.reportTotal')}</Text>
                <Text className="font-bold" style={{ color: '#FF3B30' }}>-{fmt(totalSpent)}</Text>
              </HStack>
            </Box>

            <Text className="text-center text-typography-600 text-sm mb-3">
              {t('wow.successMessage')}
            </Text>
          </Animated.View>
        )}

        <Button
          size="xl"
          className="w-full"
          style={{
            backgroundColor: allTapped ? theme.colors.primary : colors.chipBg,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/onboarding/balance');
          }}
          isDisabled={!allTapped}
        >
          <ButtonText style={{ color: allTapped ? '#FFFFFF' : colors.textMuted }}>
            {t('wow.cta')}
          </ButtonText>
        </Button>
      </Box>

      {/* Confetti overlay */}
      {showConfetti && <ConfettiEffect trigger={showConfetti} />}
    </View>
  );
}
