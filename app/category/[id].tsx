import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, SectionList, Pressable, RefreshControl, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from '@/lib/database';
import { useAccounts, useCategories, useTransactions } from '@/hooks';
import { useCategoryBudget } from '@/hooks/useBudgets';
import { useTheme } from '@/contexts';
import { TransactionCard } from '@/components/TransactionCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditCategoryModal } from '@/components/EditCategoryModal';
import { PremiumCard } from '@/components/premium';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

const DEFAULT_IDS = DEFAULT_CATEGORIES.map((c) => c.id);
const STATUS_COLORS = { green: '#22C55E', orange: '#F59E0B', red: '#EF4444' };

export default function CategoryDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const currencyCode = useCurrencyCode();
  const { formatMoney } = useAccounts();
  const { theme } = useTheme();
  const { categories, updateCategory, refresh: refreshCats } = useCategories();
  const { deleteTransaction } = useTransactions();

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const { spent, budgetLimit, percentage, status, refresh: refreshBudget } = useCategoryBudget(id, monthOffset);
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);

  const category = useMemo(() => categories.find((c) => c.id === id), [categories, id]);
  const displayName = category ? (DEFAULT_IDS.includes(category.id) ? t(`categories.${category.id}`) : category.name) : '';

  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  }, [currentMonth, i18n.language]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString();
      const categoryFilter = id === 'other'
        ? `(t.category_id = ? OR t.category_id IS NULL)`
        : `t.category_id = ?`;
      const result = await db.getAllAsync<TransactionWithCategory>(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
                a.name as account_name, a.type as account_type
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id
         WHERE ${categoryFilter} AND t.type = 'expense' AND t.deleted_at IS NULL
           AND t.created_at >= ? AND t.created_at < ?
         ORDER BY t.created_at DESC`,
        [id, start, end]
      );
      setTransactions(result);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [db, id, currentMonth]);

  useFocusEffect(useCallback(() => {
    refreshCats();
  }, [refreshCats]));

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const sections = useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {};
    transactions.forEach((tx) => {
      const key = new Date(tx.created_at).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups).map(([, txs]) => {
      const d = new Date(txs[0].created_at);
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      let title = d.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
      if (d.toDateString() === today.toDateString()) title = t('history.today');
      else if (d.toDateString() === yesterday.toDateString()) title = t('history.yesterday');
      return { title, data: txs };
    });
  }, [transactions, i18n.language, t]);

  const barColor = status ? STATUS_COLORS[status] : '#22C55E';
  const barWidth = percentage ? Math.min(percentage, 100) : 0;

  const getTimeUntilReset = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const categoryColor = category?.color || '#95A5A6';

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>
        <View className="flex-1 flex-row items-center ml-3 gap-2.5">
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: `${categoryColor}15` }}>
            <Ionicons name={(category?.icon || 'cube') as keyof typeof Ionicons.glyphMap} size={18} color={categoryColor} />
          </View>
          <RNText className="font-display text-display-md text-content-primary">{displayName}</RNText>
        </View>
        <Pressable onPress={() => setShowEdit(true)} hitSlop={12} className="w-9 h-9 rounded-xl items-center justify-center bg-bg-raised">
          <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 py-1">
            <TransactionCard transaction={item} onDelete={() => setDeleteTarget(item)} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View className="bg-bg-muted px-4 py-2">
            <RNText className="text-content-secondary font-semibold text-sm">{section.title}</RNText>
          </View>
        )}
        ListHeaderComponent={() => (
          <View className="px-4 pb-4">
            <PremiumCard className="p-5 mb-4" style={{ backgroundColor: `${categoryColor}08` }}>
              {budgetLimit ? (
                <>
                  <View className="flex-row items-baseline justify-between mb-1">
                    <RNText className="font-display text-display-lg text-content-primary">
                      {formatMoney(spent)}
                    </RNText>
                    <RNText className="font-body-regular text-body-md text-content-tertiary">
                      / {formatMoney(budgetLimit)}
                    </RNText>
                  </View>
                  <View className="flex-row items-center mt-3 mb-2">
                    <View className="flex-1 h-3 rounded-full bg-bg-raised overflow-hidden mr-3">
                      <View className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
                    </View>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${barColor}15` }}>
                      <RNText className="font-display text-display-sm" style={{ color: barColor }}>{percentage}%</RNText>
                    </View>
                  </View>
                </>
              ) : (
                <View className="flex-row items-baseline">
                  <RNText className="font-display text-display-lg text-content-primary">
                    {formatMoney(spent)}
                  </RNText>
                  <RNText className="font-body-regular text-body-md text-content-tertiary ml-2">
                    · {t('budget.unlimited')}
                  </RNText>
                </View>
              )}
              <View className="flex-row items-center mt-2">
                <Ionicons name="time-outline" size={13} color="#8E8EA0" />
                <RNText className="text-content-tertiary text-xs ml-1">{t('budget.resetIn')} {getTimeUntilReset()}</RNText>
              </View>
            </PremiumCard>

            <View className="flex-row items-center justify-between bg-bg-surface rounded-xl px-4 py-3">
              <Pressable onPress={() => setMonthOffset((p) => p - 1)} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
              </Pressable>
              <RNText className="font-body-bold text-body-md text-content-primary capitalize">{monthLabel}</RNText>
              <Pressable onPress={() => setMonthOffset((p) => Math.min(p + 1, 0))} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={monthOffset >= 0 ? '#CCC' : theme.colors.primary} />
              </Pressable>
            </View>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        stickySectionHeadersEnabled
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { fetchTransactions(); refreshBudget(); }} />}
      />

      {category && (
        <EditCategoryModal
          isOpen={showEdit}
          category={category}
          onClose={() => setShowEdit(false)}
          onSave={updateCategory}
          onSaveComplete={() => { refreshBudget(); refreshCats(); fetchTransactions(); }}
          onDelete={category.is_default === 0 ? undefined : undefined}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteTransaction(deleteTarget.id);
            fetchTransactions();
            refreshBudget();
          }
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}
