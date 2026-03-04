import { useState, useMemo, useCallback } from 'react';
import { ScrollView, Pressable, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { ExpenseCalendar } from '@/components/ExpenseCalendar';
import { TransactionCard } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks';
import { getDailyTotals } from '@/hooks/useTransactionStats';
import { useTheme } from '@/contexts';
import { SEMANTIC_COLORS } from '@/constants/darkMode';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const currencyCode = useCurrencyCode();
  const { transactions, refresh } = useTransactions();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const dailyTotals = useMemo(() => getDailyTotals(transactions, year, month), [transactions, year, month]);

  const monthExpenses = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, dt) => sum + dt.expenses, 0);
  }, [dailyTotals]);

  const monthIncome = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, dt) => sum + dt.income, 0);
  }, [dailyTotals]);

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter((tx) => {
      const d = new Date(tx.created_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [transactions, selectedDay, year, month]);

  const navigateMonth = (direction: -1 | 1) => {
    const d = new Date(year, month + direction, 1);
    const newYear = d.getFullYear();
    const newMonth = d.getMonth();
    setYear(newYear);
    setMonth(newMonth);
    // Auto-select today if navigating to current month, otherwise 1st day
    const isCurrentMonth = today.getFullYear() === newYear && today.getMonth() === newMonth;
    setSelectedDay(isCurrentMonth ? today.getDate() : 1);
  };

  const locale = i18n.language === 'mg' ? 'fr-MG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const monthLabel = new Date(year, month).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const renderTransaction = ({ item }: { item: TransactionWithCategory }) => (
    <TransactionCard transaction={item} />
  );

  return (
    <ScrollView
      style={{ flex: 1, paddingTop: insets.top }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
    >
      <HStack className="items-center mb-4 mt-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text className="text-xl font-bold text-typography-900 ml-3">{t('calendar.title')}</Text>
      </HStack>

      <VStack space="md">
        {/* Month Navigation */}
        <HStack className="items-center justify-between px-2">
          <Pressable onPress={() => navigateMonth(-1)} hitSlop={12}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
          </Pressable>
          <VStack className="items-center">
            <Text className="text-sm font-semibold text-typography-700 capitalize">{monthLabel}</Text>
            <HStack space="md">
              <Text className="text-xs font-semibold" style={{ color: SEMANTIC_COLORS.expense }}>
                -{formatCurrency(monthExpenses, currencyCode)}
              </Text>
              <Text className="text-xs font-semibold" style={{ color: SEMANTIC_COLORS.income }}>
                +{formatCurrency(monthIncome, currencyCode)}
              </Text>
            </HStack>
          </VStack>
          <Pressable onPress={() => navigateMonth(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </Pressable>
        </HStack>

        {/* Calendar Grid */}
        <Box className="p-3 rounded-xl bg-background-50">
          <ExpenseCalendar
            dailyTotals={dailyTotals}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            year={year}
            month={month}
          />
        </Box>

        {/* Selected Day Detail */}
        {selectedDay && (
          <VStack space="sm">
            <HStack className="items-center justify-between">
              <Text className="text-typography-700 font-semibold">
                {new Date(year, month, selectedDay).toLocaleDateString(locale, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              <HStack space="sm">
                {dailyTotals[selectedDay] && dailyTotals[selectedDay].expenses > 0 && (
                  <Text className="text-xs font-semibold" style={{ color: SEMANTIC_COLORS.expense }}>
                    -{formatCurrency(dailyTotals[selectedDay].expenses, currencyCode)}
                  </Text>
                )}
                {dailyTotals[selectedDay] && dailyTotals[selectedDay].income > 0 && (
                  <Text className="text-xs font-semibold" style={{ color: SEMANTIC_COLORS.income }}>
                    +{formatCurrency(dailyTotals[selectedDay].income, currencyCode)}
                  </Text>
                )}
              </HStack>
            </HStack>

            {dayTransactions.length === 0 ? (
              <Center className="py-8">
                <Text className="text-2xl mb-1">📭</Text>
                <Text className="text-typography-400 text-sm">{t('calendar.noExpenses')}</Text>
              </Center>
            ) : (
              dayTransactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} />
              ))
            )}
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
