import { useCallback } from 'react';
import { View, FlatList, RefreshControl, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BudgetCategoryCard } from '@/components/BudgetCategoryCard';
import { ActivityHeader } from '@/components/ActivityHeader';
import { EmptyState } from '@/components/premium';
import { useTransactions } from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { useTheme } from '@/contexts';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { transactions, isFetching, refresh: refreshTransactions } = useTransactions();
  const { budgets, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { t, i18n } = useTranslation();
  const monthLabel = new Date().toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  useFocusEffect(useCallback(() => {
    refreshTransactions();
    refreshBudgets();
  }, [refreshTransactions, refreshBudgets]));

  const handleRefresh = () => { refreshTransactions(); refreshBudgets(); };

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View className="px-6 py-4 bg-bg-base">
          <RNText className="font-display text-display-md text-content-primary">{t('history.title')}</RNText>
        </View>

        <FlatList
          data={budgets}
          keyExtractor={(item) => item.category.id}
          renderItem={({ item }) => (
            <BudgetCategoryCard budget={item} onPress={() => router.push(`/category/${item.category.id}` as any)} />
          )}
          ListHeaderComponent={() => (
            <>
              <ActivityHeader transactions={transactions} />
              {budgets.length > 0 && (
                <View className="px-4 mt-4 mb-2 flex-row items-center gap-2">
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.primary}15` }}
                  >
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  </View>
                  <RNText className="flex-1 font-display text-display-sm text-content-primary capitalize">
                    {t('budget.monthBudgetsWithMonth', { month: monthLabel })}
                  </RNText>
                  <View className="px-2 py-0.5 rounded-full bg-bg-raised">
                    <RNText className="text-content-secondary text-xs font-body-bold">
                      {budgets.length}
                    </RNText>
                  </View>
                </View>
              )}
            </>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 py-20 items-center justify-center">
              <EmptyState icon="wallet-outline" title={t('history.noTransactions')} description={t('history.addFirst')}
                image={require('@/assets/images/bubule-detente.png')} />
            </View>
          )}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isFetching || budgetsLoading} onRefresh={handleRefresh} />}
        />
      </View>
    </View>
  );
}
