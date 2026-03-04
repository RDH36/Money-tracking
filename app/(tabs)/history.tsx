import { useMemo, useCallback, useState } from 'react';
import { View, SectionList, RefreshControl, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { TransactionCard } from '@/components/TransactionCard';
import { PlanificationTransactionGroup } from '@/components/PlanificationTransactionGroup';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AchievementsTab } from '@/components/AchievementsTab';
import { useTransactions } from '@/hooks';
import { useTheme } from '@/contexts';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import type { PlanificationGroupData } from '@/components/PlanificationTransactionGroup';

const ITEMS_PER_PAGE = 10;

type HistoryItem =
  | { _type: 'single'; transaction: TransactionWithCategory }
  | { _type: 'group'; group: PlanificationGroupData };

interface Section {
  title: string;
  dayTotal: number;
  data: HistoryItem[];
}

type TabType = 'history' | 'achievements';
type FilterType = 'all' | 'expense' | 'income' | 'transfer';

function formatDateHeader(dateString: string, locale: string, t: any): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t('history.today');
  if (date.toDateString() === yesterday.toDateString()) return t('history.yesterday');

  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function groupByDate(transactions: TransactionWithCategory[], locale: string, t: any): Section[] {
  const dateGroups: Record<string, TransactionWithCategory[]> = {};

  transactions.forEach((transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!dateGroups[date]) dateGroups[date] = [];
    dateGroups[date].push(transaction);
  });

  return Object.entries(dateGroups).map(([, txs]) => {
    const items: HistoryItem[] = [];
    const planifGroups: Record<string, TransactionWithCategory[]> = {};

    let dayTotal = 0;
    txs.forEach((tx) => {
      dayTotal += tx.type === 'income' ? tx.amount : -tx.amount;
      if (tx.planification_id && tx.planification_title) {
        if (!planifGroups[tx.planification_id]) planifGroups[tx.planification_id] = [];
        planifGroups[tx.planification_id].push(tx);
      } else {
        items.push({ _type: 'single', transaction: tx });
      }
    });

    Object.entries(planifGroups).forEach(([planifId, groupTxs]) => {
      const firstTxIndex = txs.indexOf(groupTxs[0]);
      const insertIndex = items.filter(
        (item) => item._type === 'single' && txs.indexOf(item.transaction) < firstTxIndex
      ).length;

      items.splice(insertIndex, 0, {
        _type: 'group',
        group: {
          planification_id: planifId,
          planification_title: groupTxs[0].planification_title!,
          transactions: groupTxs,
        },
      });
    });

    return {
      title: formatDateHeader(txs[0].created_at, locale, t),
      dayTotal,
      data: items,
    };
  });
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { transactions, isFetching, refresh, deleteTransaction } = useTransactions();
  const { t, i18n } = useTranslation();
  const currencyCode = useCurrencyCode();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>(params.tab === 'achievements' ? 'achievements' : 'history');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<PlanificationGroupData | null>(null);

  useFocusEffect(
    useCallback(() => {
      refresh();
      setVisibleCount(ITEMS_PER_PAGE);
    }, [refresh])
  );

  const monthStats = useMemo(() => {
    const now = new Date();
    const monthTxs = transactions.filter((tx) => {
      const d = new Date(tx.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const expenses = monthTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    const income = monthTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    return { expenses, income, count: monthTxs.length };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((tx) => tx.type === filterType);
  }, [transactions, filterType]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount]
  );

  const hasMore = filteredTransactions.length > visibleCount;
  const loadMore = () => setVisibleCount((prev) => prev + ITEMS_PER_PAGE);

  const sections = useMemo(
    () => groupByDate(visibleTransactions, i18n.language, t),
    [visibleTransactions, i18n.language, t]
  );

  const handleDeleteGroup = async () => {
    if (!deleteGroupTarget) return;
    for (const tx of deleteGroupTarget.transactions) {
      await deleteTransaction(tx.id);
    }
    setDeleteGroupTarget(null);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('history.filterAll') },
    { key: 'expense', label: t('history.filterExpenses') },
    { key: 'income', label: t('history.filterIncome') },
    { key: 'transfer', label: t('history.filterTransfers') },
  ];

  const renderEmpty = () => (
    <Center className="flex-1 py-20">
      <Text className="text-6xl mb-4">📭</Text>
      <Text className="text-typography-500 text-center">{t('history.noTransactions')}</Text>
      <Text className="text-typography-400 text-center text-sm mt-1">{t('history.addFirst')}</Text>
    </Center>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <Box className="bg-background-100 px-4 py-2">
      <HStack className="justify-between items-center">
        <Text className="text-typography-600 font-semibold text-sm">{section.title}</Text>
        <Text
          className="text-xs font-semibold"
          style={{ color: section.dayTotal >= 0 ? '#22C55E' : '#EF4444' }}
        >
          {section.dayTotal >= 0 ? '+' : ''}{formatCurrency(Math.abs(section.dayTotal), currencyCode)}
        </Text>
      </HStack>
    </Box>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    if (item._type === 'group') {
      return (
        <Box className="px-4 py-1">
          <PlanificationTransactionGroup
            group={item.group}
            onLongPress={() => setDeleteGroupTarget(item.group)}
          />
        </Box>
      );
    }
    return (
      <Box className="px-4 py-1">
        <TransactionCard
          transaction={item.transaction}
          onLongPress={() => setDeleteTarget(item.transaction)}
        />
      </Box>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <Box className="px-4 py-4">
        <Pressable
          onPress={loadMore}
          className="py-3 rounded-xl border border-outline-200"
          style={{ backgroundColor: theme.colors.primaryLight }}
        >
          <Text className="text-center font-medium" style={{ color: theme.colors.primary }}>
            {t('history.loadMore')}
          </Text>
        </Pressable>
      </Box>
    );
  };

  const renderHeader = () => (
    <VStack space="sm" className="px-4 pb-2">
      {/* Monthly Summary */}
      <HStack space="sm">
        <Box className="flex-1 p-3 rounded-xl" style={{ backgroundColor: '#FEF2F2' }}>
          <HStack space="xs" className="items-center mb-1">
            <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
            <Text className="text-xs text-typography-500">{t('history.monthExpenses')}</Text>
          </HStack>
          <Text className="text-base font-bold" style={{ color: '#EF4444' }}>
            {formatCurrency(monthStats.expenses, currencyCode)}
          </Text>
        </Box>
        <Box className="flex-1 p-3 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
          <HStack space="xs" className="items-center mb-1">
            <Ionicons name="arrow-up-circle" size={14} color="#22C55E" />
            <Text className="text-xs text-typography-500">{t('history.monthIncome')}</Text>
          </HStack>
          <Text className="text-base font-bold" style={{ color: '#22C55E' }}>
            {formatCurrency(monthStats.income, currencyCode)}
          </Text>
        </Box>
      </HStack>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => { setFilterType(f.key); setVisibleCount(ITEMS_PER_PAGE); }}
          >
            <Box
              className="px-4 py-2 rounded-full"
              style={filterType === f.key
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: theme.colors.primaryLight }
              }
            >
              <Text
                className="text-xs font-semibold"
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

  const getItemKey = (item: HistoryItem) => {
    if (item._type === 'group') return `group-${item.group.planification_id}`;
    return item.transaction.id;
  };

  return (
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <VStack className="flex-1">
        <Box className="px-6 py-4 bg-background-0">
          <Heading size="xl" className="text-typography-900">{t('history.title')}</Heading>
          <Box className="bg-background-100 p-1 rounded-xl mt-3">
            <HStack>
              <Pressable onPress={() => setActiveTab('history')} className="flex-1">
                <Box
                  className="py-2 rounded-lg items-center"
                  style={activeTab === 'history' ? { backgroundColor: theme.colors.primary } : {}}
                >
                  <HStack space="xs" className="items-center">
                    <Ionicons
                      name={activeTab === 'history' ? 'receipt' : 'receipt-outline'}
                      size={16}
                      color={activeTab === 'history' ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: activeTab === 'history' ? '#FFFFFF' : '#9CA3AF' }}
                    >
                      {t('history.transactions')}
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
              <Pressable onPress={() => setActiveTab('achievements')} className="flex-1">
                <Box
                  className="py-2 rounded-lg items-center"
                  style={activeTab === 'achievements' ? { backgroundColor: theme.colors.primary } : {}}
                >
                  <HStack space="xs" className="items-center">
                    <Ionicons
                      name={activeTab === 'achievements' ? 'trophy' : 'trophy-outline'}
                      size={16}
                      color={activeTab === 'achievements' ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: activeTab === 'achievements' ? '#FFFFFF' : '#9CA3AF' }}
                    >
                      {t('gamification.achievements')}
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
            </HStack>
          </Box>
        </Box>

        {activeTab === 'achievements' ? (
          <AchievementsTab />
        ) : (
        <SectionList
          sections={sections}
          extraData={transactions}
          keyExtractor={getItemKey}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          stickySectionHeadersEnabled
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
        />
        )}
      </VStack>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTransaction(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteGroupTarget}
        title={t('history.deleteConfirm')}
        message={t('planification.deleteTransactionMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteGroupTarget(null)}
        onConfirm={handleDeleteGroup}
      />
    </View>
  );
}
