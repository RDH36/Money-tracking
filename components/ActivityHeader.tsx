import { useMemo } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

type FilterType = 'all' | 'expense' | 'income' | 'transfer';

interface ActivityHeaderProps {
  transactions: TransactionWithCategory[];
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

function useTodayData(transactions: TransactionWithCategory[]) {
  return useMemo(() => {
    const todayStr = new Date().toDateString();
    let todayExpenses = 0, todayIncome = 0;

    transactions.forEach((tx) => {
      if (tx.transfer_id) return;
      if (new Date(tx.created_at).toDateString() === todayStr) {
        if (tx.type === 'expense') todayExpenses += tx.amount;
        else if (tx.type === 'income') todayIncome += tx.amount;
      }
    });

    return { todayExpenses, todayIncome };
  }, [transactions]);
}

export function ActivityHeader({ transactions, filterType, onFilterChange }: ActivityHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const currencyCode = useCurrencyCode();
  const { todayExpenses, todayIncome } = useTodayData(transactions);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('history.filterAll') },
    { key: 'expense', label: t('history.filterExpenses') },
    { key: 'income', label: t('history.filterIncome') },
    { key: 'transfer', label: t('history.filterTransfers') },
  ];

  const todayTotal = todayExpenses + todayIncome;

  return (
    <VStack space="sm" className="px-4 pb-2">
      {/* Today's Activity */}
      {todayTotal > 0 && (
        <Box className="p-5 rounded-xl" style={{ backgroundColor: theme.colors.primary + '10' }}>
          <HStack className="justify-between items-center">
            <HStack space="md" className="items-center">
              <Box className="p-2.5 rounded-lg" style={{ backgroundColor: theme.colors.primary + '20' }}>
                <Ionicons name="today" size={24} color={theme.colors.primary} />
              </Box>
              <VStack>
                <Text className="text-sm text-typography-400">{t('history.spentToday')}</Text>
                <Text className="text-lg font-bold" style={{ color: '#EF4444' }}>
                  {formatCurrency(todayExpenses, currencyCode)}
                </Text>
              </VStack>
            </HStack>
            {todayIncome > 0 && (
              <VStack className="items-end">
                <Text className="text-sm text-typography-400">{t('history.earnedToday')}</Text>
                <Text className="text-lg font-bold" style={{ color: '#22C55E' }}>
                  +{formatCurrency(todayIncome, currencyCode)}
                </Text>
              </VStack>
            )}
          </HStack>
        </Box>
      )}

      {/* Quick Access Cards */}
      <HStack space="sm">
        <Pressable onPress={() => router.push('/reports' as any)} className="flex-1">
          <HStack
            space="md"
            className="p-5 rounded-xl items-center"
            style={{ backgroundColor: theme.colors.primaryLight }}
          >
            <Ionicons name="bar-chart" size={26} color={theme.colors.primary} />
            <VStack className="flex-1">
              <Text className="text-base font-semibold" style={{ color: theme.colors.primary }}>
                {t('history.reports')}
              </Text>
              <Text className="text-sm text-typography-400" numberOfLines={1}>
                {t('history.seeReports')}
              </Text>
            </VStack>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </HStack>
        </Pressable>
        <Pressable onPress={() => router.push('/calendar' as any)} className="flex-1">
          <HStack
            space="md"
            className="p-5 rounded-xl items-center"
            style={{ backgroundColor: theme.colors.primaryLight }}
          >
            <Ionicons name="calendar" size={26} color={theme.colors.primary} />
            <VStack className="flex-1">
              <Text className="text-base font-semibold" style={{ color: theme.colors.primary }}>
                {t('history.calendar')}
              </Text>
              <Text className="text-sm text-typography-400" numberOfLines={1}>
                {t('history.seeCalendar')}
              </Text>
            </VStack>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </HStack>
        </Pressable>
      </HStack>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {filters.map((f) => (
          <Pressable key={f.key} onPress={() => onFilterChange(f.key)}>
            <Box
              className="px-5 py-3 rounded-full"
              style={filterType === f.key
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.colors.primaryLight }
              }
            >
              <Text
                className="text-sm font-semibold"
                style={{ color: filterType === f.key ? '#FFFFFF' : theme.colors.primary }}
              >
                {f.label}
              </Text>
            </Box>
          </Pressable>
        ))}
      </ScrollView>
    </VStack>
  );
}
