import { useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/premium';
import { useTransactions, useAccounts } from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { useV2 } from '@/constants/designTokensV2';
import {
  ActivityScreenHeader,
  TodayCard,
  QuickActionCards,
  ManageCategoriesLink,
  BudgetByCategoryCard,
  type ActivityBudgetItem,
} from '@/components/activity';
import { formatMonthLabelFr } from '@/components/dashboard';

function isSameDay(iso: string, ref: Date): boolean {
  try {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear()
      && d.getMonth() === ref.getMonth()
      && d.getDate() === ref.getDate();
  } catch {
    return false;
  }
}

function startOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function endOfMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const { transactions, isFetching, refresh: refreshTransactions } = useTransactions();
  const { budgets, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { formatMoney } = useAccounts();

  useFocusEffect(useCallback(() => {
    refreshTransactions();
    refreshBudgets();
  }, [refreshTransactions, refreshBudgets]));

  const now = new Date();

  const today = useMemo(() => {
    let income = 0, expense = 0, count = 0;
    for (const tx of transactions) {
      if (tx.transfer_id) continue;
      if (!isSameDay(tx.created_at, now)) continue;
      count++;
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    }
    return { income, expense, count, net: income - expense };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const activityBudgets: ActivityBudgetItem[] = useMemo(() => {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const txCountByCat: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.transfer_id || tx.type !== 'expense') continue;
      const t = new Date(tx.created_at).getTime();
      if (t < monthStart || t >= monthEnd) continue;
      const key = tx.category_id ?? 'other';
      txCountByCat[key] = (txCountByCat[key] ?? 0) + 1;
    }
    const items: ActivityBudgetItem[] = budgets.map((b) => {
      const limit = b.budgetLimit ?? 0;
      const pct = limit > 0 ? (b.spent / limit) * 100 : 0;
      return {
        id: b.category.id,
        name: b.category.name,
        icon: b.category.icon,
        color: b.category.color,
        spent: b.spent,
        limit,
        txCount: txCountByCat[b.category.id] ?? 0,
        alert: pct >= 90 && pct <= 100,
      };
    });
    items.sort((a, b) => {
      const aHas = a.limit > 0, bHas = b.limit > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;
      if (aHas) return (b.spent / b.limit) - (a.spent / a.limit);
      return b.spent - a.spent;
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgets, transactions]);

  const todayDateLabel = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric', month: 'short',
  }).format(now);

  const showEmpty = transactions.length === 0 && activityBudgets.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || budgetsLoading}
            onRefresh={() => { refreshTransactions(); refreshBudgets(); }}
            tintColor={v2.brand}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <ActivityScreenHeader
            monthLabel={formatMonthLabelFr(now, i18n.language)}
            title={t('activity.titleWithBudgets')}
          />

          <View style={{ marginTop: 14 }}>
            <TodayCard
              dateLabel={todayDateLabel}
              transactionCount={today.count}
              netAmount={today.net}
              spent={today.expense}
              received={today.income}
              formatMoney={formatMoney}
            />
          </View>

          <QuickActionCards
            onReportsPress={() => router.push('/reports' as any)}
            onCalendarPress={() => router.push('/calendar' as any)}
          />

          <ManageCategoriesLink onPress={() => router.push('/settings/categories' as any)} />

          {activityBudgets.length > 0 ? (
            <View style={{ marginTop: 4 }}>
              <BudgetByCategoryCard
                monthLabel={formatMonthLabelFr(now, i18n.language)}
                budgets={activityBudgets}
                formatMoney={formatMoney}
                onCategoryPress={(id) => router.push(`/category/${id}` as any)}
              />
            </View>
          ) : null}

          {transactions.length > 0 ? (
            <Pressable
              onPress={() => router.push('/transactions' as any)}
              style={{
                marginTop: 14,
                backgroundColor: v2.bgSurface,
                borderWidth: 1,
                borderColor: v2.hairline,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="receipt-outline" size={16} color={v2.brand} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
                {t('activity.seeAllTransactions')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={v2.brand} />
            </Pressable>
          ) : null}

          {showEmpty ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <EmptyState
                icon="wallet-outline"
                title={t('history.noTransactions')}
                description={t('history.addFirst')}
                image={require('@/assets/images/bubule-detente.png')}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
