import { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Center } from '@/components/ui/center';
import { useAccounts, useTransactions, useSettings, useTips, useWhatsNew, useGamification } from '@/hooks';
import { TransactionCard } from '@/components/TransactionCard';
import { PlanificationTransactionGroup } from '@/components/PlanificationTransactionGroup';
import { AddAccountModal } from '@/components/AddAccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GamificationBar } from '@/components/GamificationBar';
import { LevelUpModal } from '@/components/LevelUpModal';
import { useTheme } from '@/contexts';
import { useGamificationStore } from '@/stores/gamificationStore';
import { usePostHog } from 'posthog-react-native';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import type { PlanificationGroupData } from '@/components/PlanificationTransactionGroup';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { accounts, formattedTotal, refresh: refreshAccounts, isLoading: accountsLoading, formatMoney, createAccount, canCreateAccount, customAccountsCount, maxCustomAccounts } = useAccounts();
  const { transactions, refresh: refreshTransactions, isFetching, deleteTransaction } = useTransactions();
  const { balanceHidden, toggleBalanceVisibility } = useSettings();
  const { currentTip, showTip } = useTips('dashboard');
  const { hasNew, checkNew } = useWhatsNew();
  const gamification = useGamification();
  const posthog = usePostHog();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const recentItems = useMemo(() => {
    const recent = transactions.slice(0, 5);
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
    await Promise.all([refreshAccounts(), refreshTransactions()]);
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
    <View className="flex-1 bg-background-0" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={<RefreshControl refreshing={isFetching || accountsLoading} onRefresh={handleRefresh} />}
      >
        <VStack className="p-6" space="lg">
          <HStack className="justify-between items-center">
            <Heading size="xl" className="text-typography-900">{t('dashboard.title')}</Heading>
            <Pressable onPress={() => router.push('/whats-new')} hitSlop={8} className="p-2">
              <View>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
                {hasNew && (
                  <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                )}
              </View>
            </Pressable>
          </HStack>

          <VStack>
            <Box className="p-6 rounded-2xl" style={{ backgroundColor: theme.colors.primary }}>
              <HStack className="justify-between items-start">
                <VStack>
                  <Text className="text-white text-sm mb-1">{t('dashboard.totalBalance')}</Text>
                  <Heading size="2xl" className="text-white">{balanceHidden ? hiddenAmount : formattedTotal}</Heading>
                </VStack>
                <Pressable onPress={toggleBalanceVisibility} className="p-2">
                  <Ionicons name={balanceHidden ? 'eye-off' : 'eye'} size={24} color="white" />
                </Pressable>
              </HStack>
            </Box>
            {showTip && currentTip && (
              <HStack className="mt-2 p-3 rounded-xl items-center" style={{ backgroundColor: theme.colors.secondary + '20' }} space="sm">
                <Ionicons name="bulb" size={16} color={theme.colors.secondary} />
                <Text className="flex-1 text-xs" style={{ color: theme.colors.secondary }}>{t(currentTip)}</Text>
              </HStack>
            )}
            <GamificationBar
              currentStreak={gamification.currentStreak}
              totalXP={gamification.totalXP}
              dailyChallengeCompleted={gamification.dailyChallengeCompleted}
              isLoading={gamification.isLoading}
              onPress={() => router.push({ pathname: '/history', params: { tab: 'achievements' } })}
            />
          </VStack>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {accounts.map((account) => (
              <Box
                key={account.id}
                className="p-4 rounded-xl border"
                style={{
                  borderColor: getAccountColor(account.type) + '40',
                  backgroundColor: getAccountColor(account.type) + '10',
                  minWidth: 150,
                }}
              >
                <HStack space="sm" className="items-center mb-2">
                  <Ionicons name={account.icon as keyof typeof Ionicons.glyphMap} size={18} color={getAccountColor(account.type)} />
                  <Text className="text-xs font-medium" style={{ color: getAccountColor(account.type) }} numberOfLines={1}>
                    {getAccountName(account)}
                  </Text>
                </HStack>
                <Text className="font-bold text-base" style={{ color: getAccountColor(account.type) }}>
                  {balanceHidden ? hiddenAmount : formatMoney(account.current_balance)}
                </Text>
              </Box>
            ))}
            <Pressable onPress={() => setShowAddAccount(true)}>
              <Box className="p-4 rounded-xl border-2 border-dashed border-outline-300 items-center justify-center" style={{ minWidth: 100, minHeight: 80 }}>
                <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
                <Text className="text-xs mt-1" style={{ color: theme.colors.primary }}>{t('dashboard.addAccount')}</Text>
              </Box>
            </Pressable>
          </ScrollView>

          <VStack space="md">
            <Text className="text-typography-700 font-semibold">{t('dashboard.recentTransactions')}</Text>
            {recentItems.length === 0 ? (
              <Center className="py-8 bg-background-0 rounded-xl border border-outline-100">
                <Text className="text-4xl mb-2">📭</Text>
                <Text className="text-typography-500 text-center text-sm">{t('dashboard.noTransactions')}</Text>
              </Center>
            ) : (
              <VStack space="sm">
                {recentItems.map((item) =>
                  item._type === 'group' ? (
                    <PlanificationTransactionGroup
                      key={`group-${item.group.planification_id}`}
                      group={item.group}
                      onLongPress={() => setDeleteTarget(item.group.transactions[0])}
                    />
                  ) : (
                    <TransactionCard
                      key={item.transaction.id}
                      transaction={item.transaction}
                      onLongPress={() => setDeleteTarget(item.transaction)}
                    />
                  )
                )}
                {transactions.length > 5 && (
                  <Pressable onPress={() => router.push('/history')} className="py-3 px-4 rounded-xl" style={{ backgroundColor: theme.colors.secondary }}>
                    <HStack className="justify-center items-center" space="sm">
                      <Text className="text-white font-semibold">{t('dashboard.viewMore')}</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    </HStack>
                  </Pressable>
                )}
              </VStack>
            )}
          </VStack>
        </VStack>
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
