import { useCallback, useState } from 'react';
import { View, FlatList, RefreshControl, Pressable, Text as RNText } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BudgetCategoryCard } from '@/components/BudgetCategoryCard';
import { AchievementsTab } from '@/components/AchievementsTab';
import { ActivityHeader } from '@/components/ActivityHeader';
import { EmptyState } from '@/components/premium';
import { useTransactions } from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { useTheme } from '@/contexts';
import { usePostHog } from 'posthog-react-native';
import { cn } from '@/lib/utils';

type TabType = 'history' | 'achievements';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { transactions, isFetching, refresh: refreshTransactions } = useTransactions();
  const { budgets, isLoading: budgetsLoading, refresh: refreshBudgets } = useBudgets();
  const { t } = useTranslation();
  const posthog = usePostHog();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>(params.tab === 'achievements' ? 'achievements' : 'history');

  useFocusEffect(useCallback(() => {
    refreshTransactions();
    refreshBudgets();
  }, [refreshTransactions, refreshBudgets]));

  const handleRefresh = () => { refreshTransactions(); refreshBudgets(); };

  const TabButton = ({ tab, icon, label }: { tab: TabType; icon: string; label: string }) => (
    <Pressable onPress={() => { posthog.capture('tab_switched', { tab, source: 'history' }); setActiveTab(tab); }} className="flex-1">
      <View className={cn('py-2 rounded-lg items-center', activeTab === tab ? 'bg-brand' : '')}>
        <View className="flex-row gap-1 items-center">
          <Ionicons name={(activeTab === tab ? icon : `${icon}-outline`) as any} size={16} color={activeTab === tab ? '#FFFFFF' : '#9CA3AF'} />
          <RNText className="text-sm font-semibold" style={{ color: activeTab === tab ? '#FFFFFF' : '#9CA3AF' }}>{label}</RNText>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View className="px-6 py-4 bg-bg-base">
          <RNText className="font-display text-display-md text-content-primary">{t('history.title')}</RNText>
          <View className="bg-bg-raised p-1 rounded-xl mt-3">
            <View className="flex-row">
              <TabButton tab="history" icon="receipt" label={t('history.transactions')} />
              <TabButton tab="achievements" icon="trophy" label={t('gamification.achievements')} />
            </View>
          </View>
        </View>

        {activeTab === 'achievements' ? (
          <AchievementsTab />
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(item) => item.category.id}
            renderItem={({ item }) => (
              <BudgetCategoryCard budget={item} onPress={() => router.push(`/category/${item.category.id}` as any)} />
            )}
            ListHeaderComponent={() => <ActivityHeader transactions={transactions} />}
            ListEmptyComponent={() => (
              <View className="flex-1 py-20 items-center justify-center">
                <EmptyState icon="wallet-outline" title={t('history.noTransactions')} description={t('history.addFirst')}
                  image={require('@/assets/images/bubule-detente.png')} />
              </View>
            )}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={isFetching || budgetsLoading} onRefresh={handleRefresh} />}
          />
        )}
      </View>
    </View>
  );
}
