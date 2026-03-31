import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl, Text as RNText, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccounts, useTransactions, useSettings, useTips, useWhatsNew, useGamification } from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { BudgetSummarySection } from '@/components/BudgetSummarySection';
import { BudgetOverspendBanner } from '@/components/BudgetOverspendBanner';
import { TransactionCard } from '@/components/TransactionCard';
import { PlanificationTransactionGroup } from '@/components/PlanificationTransactionGroup';
import { AddAccountModal } from '@/components/AddAccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GamificationBar } from '@/components/GamificationBar';
import { LevelUpModal } from '@/components/LevelUpModal';
import { FadeIn, StaggerItem, PremiumCard, EmptyState, PrimaryButton } from '@/components/premium';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { useGamificationStore } from '@/stores/gamificationStore';
import { usePostHog } from 'posthog-react-native';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import type { PlanificationGroupData } from '@/components/PlanificationTransactionGroup';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = useEffectiveColorScheme() === 'dark';
  const { accounts, formattedTotal, refresh: refreshAccounts, isLoading: accountsLoading, formatMoney, createAccount, canCreateAccount, customAccountsCount, maxCustomAccounts } = useAccounts();
  const { transactions, refresh: refreshTransactions, isFetching, deleteTransaction } = useTransactions();
  const { topBudgets, overspentBudgets, refresh: refreshBudgets } = useBudgets();
  const { balanceHidden, toggleBalanceVisibility } = useSettings();
  const { currentTip, showTip } = useTips('dashboard');
  const { hasNew, checkNew } = useWhatsNew();
  const gamification = useGamification();
  const posthog = usePostHog();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const recentItems = useMemo(() => {
    const recent = transactions.slice(0, 4);
    const items: ({ _type: 'single'; transaction: TransactionWithCategory } | { _type: 'group'; group: PlanificationGroupData })[] = [];
    const planifGroups: Record<string, TransactionWithCategory[]> = {};

    recent.forEach((tx) => {
      if (tx.planification_id && tx.planification_title) {
        if (!planifGroups[tx.planification_id]) planifGroups[tx.planification_id] = [];
        planifGroups[tx.planification_id].push(tx);
      } else {
        items.push({ _type: 'single', transaction: tx });
      }
    });

    Object.entries(planifGroups).forEach(([planifId, groupTxs]) => {
      const firstTxIndex = recent.indexOf(groupTxs[0]);
      const insertIndex = items.filter(
        (item) => item._type === 'single' && recent.indexOf(item.transaction) < firstTxIndex
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

    return items;
  }, [transactions]);

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshTransactions();
      refreshBudgets();
      checkNew();
      if (!gamification.isLoading) {
        gamification.generateDailyChallenge();
        gamification.recordActivity().then(async () => {
          await gamification.checkBadges();
          const level = gamification.getLevelUp();
          if (level) setLevelUp(level);
          const streak = useGamificationStore.getState().currentStreak;
          gamification.scheduleNotifications({
            streakTitle: t('gamification.notifStreakTitle', { count: streak }),
            streakBody: t('gamification.notifStreakBody'),
            challengeTitle: t('gamification.notifChallengeTitle'),
            challengeBody: t('gamification.notifChallengeBody'),
            weeklyTitle: t('gamification.notifWeeklyTitle'),
            weeklyBody: t('gamification.notifWeeklyBody'),
          });
        });
      }
    }, [refreshAccounts, refreshTransactions, checkNew, gamification.isLoading])
  );

  const handleRefresh = async () => {
    await Promise.all([refreshAccounts(), refreshTransactions(), refreshBudgets()]);
  };

  const handleCreateAccount = async (params: Parameters<typeof createAccount>[0]) => {
    const result = await createAccount(params);
    if (result.success) {
      posthog.capture('account_created', {
        account_type: params.type,
      });
      setShowAddAccount(false);
    }
    return result;
  };

  const hiddenAmount = '••••••';
  const getAccountColor = (type: string) => (type === 'bank' ? theme.colors.primary : theme.colors.secondary);
  const getAccountName = (account: typeof accounts[0]) => {
    if (account.is_default === 1) {
      return account.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash');
    }
    return account.name;
  };

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isFetching || accountsLoading} onRefresh={handleRefresh} />}
      >
        <View className="p-6 gap-6">
          <FadeIn>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-0.5">
                <Image source={require('@/assets/images/logo.png')} className="w-10 h-10" resizeMode="contain" />
                <RNText className="font-display text-display-md text-content-primary font-bold">Mitsitsy</RNText>
              </View>
              <Pressable onPress={() => router.push('/whats-new')} hitSlop={8} className="p-2">
                <View>
                  <Ionicons name="notifications-outline" size={24} color={isDark ? '#A0A0B0' : '#6E6E7D'} />
                  {hasNew && (
                    <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                  )}
                </View>
              </Pressable>
            </View>
          </FadeIn>

          <View className="gap-2">
            <FadeIn>
              <PremiumCard className="p-6" style={{ backgroundColor: theme.colors.primary }}>
                <View className="flex-row justify-between items-start">
                  <View>
                    <RNText className="text-white text-sm mb-1">{t('dashboard.totalBalance')}</RNText>
                    <RNText className="font-display text-display-md text-white">{balanceHidden ? hiddenAmount : formattedTotal}</RNText>
                  </View>
                  <Pressable onPress={toggleBalanceVisibility} className="p-2">
                    <Ionicons name={balanceHidden ? 'eye-off' : 'eye'} size={24} color="white" />
                  </Pressable>
                </View>
                <BudgetOverspendBanner overspentBudgets={overspentBudgets} />
              </PremiumCard>
            </FadeIn>
            {showTip && currentTip && (
              <FadeIn>
                <View className="mt-2 p-3 rounded-xl flex-row items-center bg-bg-surface gap-2">
                  <Ionicons name="bulb" size={16} color="#8B5CF6" />
                  <RNText className="flex-1 text-xs text-brand">{t(currentTip)}</RNText>
                </View>
              </FadeIn>
            )}
            <GamificationBar
              currentStreak={gamification.currentStreak}
              totalXP={gamification.totalXP}
              dailyChallengeCompleted={gamification.dailyChallengeCompleted}
              isLoading={gamification.isLoading}
              onPress={() => router.push({ pathname: '/history', params: { tab: 'achievements' } })}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {accounts.map((account) => (
              <PremiumCard key={account.id} className="p-4 min-w-[150px]">
                <View className="gap-2 mb-2 flex-row items-center gap-sm">
                  <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={18} style={{ color: getAccountColor(account.type) }} />
                  <RNText className="text-ui-sm font-ui flex-1" style={{ color: getAccountColor(account.type) }} numberOfLines={1}>
                    {getAccountName(account)}
                  </RNText>
                </View>
                <RNText className="font-ui text-ui-lg" style={{ color: getAccountColor(account.type) }}>
                  {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                </RNText>
              </PremiumCard>
            ))}
            <Pressable onPress={() => setShowAddAccount(true)}>
              <View className="p-4 rounded-xl border-2 border-dashed border-content-disabled items-center justify-center bg-bg-raised" style={{ minWidth: 100, minHeight: 80 }}>
                <Ionicons name="add-circle-outline" size={28} style={{ color: theme.colors.primary }} />
                <RNText className="text-xs mt-1" style={{ color: theme.colors.primary }}>{t('dashboard.addAccount')}</RNText>
              </View>
            </Pressable>
          </ScrollView>

          <BudgetSummarySection budgets={topBudgets} />

          <View className="gap-3">
            <RNText className="font-ui text-ui-lg text-content-primary">{t('dashboard.recentTransactions')}</RNText>
            {recentItems.length === 0 ? (
              <EmptyState icon="receipt-outline" title={t('dashboard.noTransactions')} image={require('@/assets/images/bubule-detente.png')} />
            ) : (
              <View className="gap-2">
                {recentItems.map((item, i) =>
                  item._type === 'group' ? (
                    <StaggerItem key={`group-${item.group.planification_id}`} index={i}>
                      <PlanificationTransactionGroup
                        group={item.group}
                        onLongPress={() => setDeleteTarget(item.group.transactions[0])}
                      />
                    </StaggerItem>
                  ) : (
                    <StaggerItem key={item.transaction.id} index={i}>
                      <TransactionCard
                        transaction={item.transaction}
                        onDelete={() => setDeleteTarget(item.transaction)}
                      />
                    </StaggerItem>
                  )
                )}
                {transactions.length > 4 && (
                  <PrimaryButton
                    label={t('dashboard.viewMore')}
                    onPress={() => router.push('/history')}
                    className="flex-row justify-center items-center gap-2"
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')}
        confirmText={t('common.delete')}
        isDestructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            posthog.capture('transaction_deleted', {
              transaction_type: deleteTarget.type,
              source: 'dashboard',
            });
            deleteTransaction(deleteTarget.id);
            refreshAccounts();
          }
          setDeleteTarget(null);
        }}
      />

      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onCreateAccount={handleCreateAccount}
        canCreateAccount={canCreateAccount}
        customAccountsCount={customAccountsCount}
        maxCustomAccounts={maxCustomAccounts}
      />

      <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />
    </View>
  );
}
