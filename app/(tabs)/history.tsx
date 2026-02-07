import { useMemo, useCallback, useState } from 'react';
import { View, SectionList, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { TransactionCard } from '@/components/TransactionCard';
import { useTransactions } from '@/hooks';
import { useTheme } from '@/contexts';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

const ITEMS_PER_PAGE = 10;

interface Section {
  title: string;
  data: TransactionWithCategory[];
}

function formatDateHeader(dateString: string, locale: string, t: any): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return t('history.today');
  if (isYesterday) return t('history.yesterday');

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function groupByDate(transactions: TransactionWithCategory[], locale: string, t: any): Section[] {
  const groups: Record<string, TransactionWithCategory[]> = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
  });

  return Object.entries(groups).map(([date, data]) => ({
    title: formatDateHeader(data[0].created_at, locale, t),
    data,
  }));
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { transactions, isFetching, refresh } = useTransactions();
  const { t, i18n } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      refresh();
      setVisibleCount(ITEMS_PER_PAGE);
    }, [refresh])
  );

  const visibleTransactions = useMemo(
    () => transactions.slice(0, visibleCount),
    [transactions, visibleCount]
  );

  const hasMore = transactions.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const sections = useMemo(() => groupByDate(visibleTransactions, i18n.language, t), [visibleTransactions, i18n.language, t]);

  const renderEmpty = () => (
    <Center className="flex-1 py-20">
      <Text className="text-6xl mb-4">📭</Text>
      <Text className="text-typography-500 text-center">
        {t('history.noTransactions')}
      </Text>
      <Text className="text-typography-400 text-center text-sm mt-1">
        {t('history.addFirst')}
      </Text>
    </Center>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Box className="bg-background-100 px-4 py-2">
      <Text className="text-typography-600 font-semibold text-sm">
        {section.title}
      </Text>
    </Box>
  );

  const renderItem = ({ item }: { item: TransactionWithCategory }) => (
    <Box className="px-4 py-1">
      <TransactionCard transaction={item} />
    </Box>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <Box className="px-4 py-4">
        <Pressable
          onPress={loadMore}
          className="py-3 rounded-xl border border-outline-200"
          style={{ backgroundColor: theme.colors.primaryLight }}
        >
          <Text
            className="text-center font-medium"
            style={{ color: theme.colors.primary }}
          >
            {t('history.loadMore')}
          </Text>
        </Pressable>
      </Box>
    );
  };

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <VStack className="flex-1">
        <Box className="px-6 py-4 bg-background-0">
          <Heading size="xl" className="text-typography-900">
            {t('history.title')}
          </Heading>
        </Box>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
          stickySectionHeadersEnabled
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refresh} />
          }
        />
      </VStack>
    </View>
  );
}
