import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from '@/lib/database';
import { useAccounts, useCategories, useTransactions } from '@/hooks';
import { useCategoryBudget } from '@/hooks/useBudgets';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EditCategoryModal } from '@/components/EditCategoryModal';
import { DeleteCategoryDialog } from '@/components/DeleteCategoryDialog';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import { getCategoryDisplayName } from '@/constants/categories';
import {
  CategoryDetailHeader,
  CategoryHeroCard,
  MonthSelector,
  DayTransactionGroup,
} from '@/components/category-detail';
import type { Category } from '@/types';
import type { TransactionWithCategory } from '@/hooks/useTransactions';

function getResetTime(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diff = next.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}j ${hours}h`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function CategoryDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  const { formatMoney } = useAccounts();
  const { categories, updateCategory, refresh: refreshCats, deleteCategoryWithOptions, getTransactionCount } = useCategories();
  const { deleteTransaction } = useTransactions();

  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const { spent, budgetLimit, percentage, status, refresh: refreshBudget } = useCategoryBudget(id, monthOffset);
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTxTarget, setDeleteTxTarget] = useState<TransactionWithCategory | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null);
  const [deleteCatTxCount, setDeleteCatTxCount] = useState(0);

  const category = useMemo(() => categories.find((c) => c.id === id), [categories, id]);
  const displayName = category ? getCategoryDisplayName(category.id, category.name, t) : '';

  const currentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthLabel = useMemo(
    () => currentMonth.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' }),
    [currentMonth, i18n.language]
  );

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1).toISOString();
      const filter = id === 'other' ? `(t.category_id = ? OR t.category_id IS NULL)` : `t.category_id = ?`;
      const result = await db.getAllAsync<TransactionWithCategory>(
        `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
                a.name as account_name, a.type as account_type
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN accounts a ON t.account_id = a.id
         WHERE ${filter} AND t.type = 'expense' AND t.deleted_at IS NULL
           AND t.transaction_date >= ? AND t.transaction_date < ?
         ORDER BY t.transaction_date DESC`,
        [id, start, end]
      );
      setTransactions(result);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  }, [db, id, currentMonth]);

  useFocusEffect(useCallback(() => { refreshCats(); }, [refreshCats]));
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const groups = useMemo(() => {
    const buckets: Record<string, TransactionWithCategory[]> = {};
    for (const tx of transactions) {
      const key = new Date(tx.transaction_date).toDateString();
      (buckets[key] = buckets[key] ?? []).push(tx);
    }
    const today = new Date().toDateString();
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString(); })();
    return Object.entries(buckets).map(([key, items]) => {
      const d = new Date(items[0].transaction_date);
      let label = d.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
      if (key === today) label = t('categoryDetail.today');
      else if (key === yesterday) label = t('categoryDetail.yesterday');
      return { key, label, items };
    });
  }, [transactions, i18n.language, t]);

  const handleRequestDeleteCategory = async (cat: Category) => {
    const count = await getTransactionCount(cat.id);
    setDeleteCatTxCount(count);
    setDeleteCatTarget(cat);
  };
  const handleConfirmDeleteCategory = async (action: 'move' | 'delete' | 'simple') => {
    if (!deleteCatTarget) return;
    await deleteCategoryWithOptions(deleteCatTarget.id, action === 'simple' ? 'delete' : action);
    setDeleteCatTarget(null);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { fetchTransactions(); refreshBudget(); }}
            tintColor={v2.brand}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <CategoryDetailHeader
            categoryName={displayName}
            categoryIcon={category?.icon ?? null}
            categoryColor={category?.color ?? null}
            onBack={() => router.back()}
            onEdit={() => setShowEdit(true)}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <CategoryHeroCard
            categoryColor={category?.color ?? null}
            monthLabel={monthLabel}
            spent={spent}
            limit={budgetLimit}
            percentage={percentage}
            status={status}
            resetTime={getResetTime()}
            formatMoney={formatMoney}
            currencyCode={currency.code}
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <MonthSelector
            label={monthLabel}
            onPrev={() => setMonthOffset((p) => p - 1)}
            onNext={() => setMonthOffset((p) => Math.min(p + 1, 0))}
            nextDisabled={monthOffset >= 0}
          />
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {groups.length === 0 ? (
            <Text
              style={{
                fontFamily: v2.fontUI, fontSize: 12, color: v2.inkSubtle,
                textAlign: 'center', paddingVertical: 40, fontStyle: 'italic',
              }}
            >
              {t('categoryDetail.noTransactionsThisMonth')}
            </Text>
          ) : (
            groups.map((g) => (
              <DayTransactionGroup
                key={g.key}
                dayLabel={g.label}
                transactions={g.items}
                formatMoney={formatMoney}
                onTransactionDelete={(tx) => setDeleteTxTarget(tx)}
                currencyCode={currency.code}
              />
            ))
          )}
        </View>
      </ScrollView>

      {category ? (
        <EditCategoryModal
          isOpen={showEdit}
          category={category}
          onClose={() => setShowEdit(false)}
          onSave={updateCategory}
          onSaveComplete={() => { refreshBudget(); refreshCats(); fetchTransactions(); }}
          onDelete={category.id !== 'other' ? handleRequestDeleteCategory : undefined}
        />
      ) : null}

      <DeleteCategoryDialog
        isOpen={!!deleteCatTarget}
        category={deleteCatTarget}
        transactionCount={deleteCatTxCount}
        onClose={() => setDeleteCatTarget(null)}
        onMoveToOther={() => handleConfirmDeleteCategory('move')}
        onDeleteAll={() => handleConfirmDeleteCategory('delete')}
        onDeleteSimple={() => handleConfirmDeleteCategory('simple')}
      />

      <ConfirmDialog
        isOpen={!!deleteTxTarget}
        title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTxTarget(null)}
        onConfirm={async () => {
          if (deleteTxTarget) {
            await deleteTransaction(deleteTxTarget.id);
            fetchTransactions();
            refreshBudget();
          }
          setDeleteTxTarget(null);
        }}
      />
    </View>
  );
}
