import { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePostHog } from 'posthog-react-native';
import {
  useAccounts,
  useTransactions,
  useSettings,
  useWhatsNew,
  useAppLockBanner,
  useGamification,
  useWeeklyChallenge,
  useMonthlyChallenge,
  useQuests,
} from '@/hooks';
import { useBudgets } from '@/hooks/useBudgets';
import { useDashboardFocus } from '@/hooks/useDashboardFocus';
import { calculateLevel, xpProgress, xpToNextLevel } from '@/constants/badges';
import { AddAccountModal } from '@/components/AddAccountModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LevelUpModal } from '@/components/LevelUpModal';
import { FeatureUnlockedModal } from '@/components/FeatureUnlockedModal';
import { LockedFeatureModal, type LockedFeature } from '@/components/LockedFeatureModal';
import {
  DashboardHeader,
  BalanceHeroCard,
  AppLockBanner,
  StreakXPStrip,
  AccountsCarousel,
  BudgetsCard,
  RecentTransactionsCard,
  formatDateLabelFr,
  formatMonthLabelFr,
  startOfMonth,
} from '@/components/dashboard';
import { CloudBackupSurveyPrompt } from '@/components/cloud-backup-survey/CloudBackupSurveyPrompt';
import { useV2 } from '@/constants/designTokensV2';
import { useCurrency } from '@/stores/settingsStore';
import type { TransactionWithCategory } from '@/hooks/useTransactions';
import type { AccountWithBalance } from '@/types';

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  const insets = useSafeAreaInsets();
  const {
    accounts,
    refresh: refreshAccounts,
    isLoading: accountsLoading,
    createAccount,
    canCreateAccount,
    customAccountsCount,
    maxCustomAccounts,
  } = useAccounts();
  const {
    transactions,
    refresh: refreshTransactions,
    isFetching,
    deleteTransaction,
  } = useTransactions();
  const { topBudgets, overspentBudgets, refresh: refreshBudgets } = useBudgets();
  const { balanceHidden, toggleBalanceVisibility, appLockEnabled } = useSettings();
  const appLockBanner = useAppLockBanner();
  const { hasNew, checkNew } = useWhatsNew();
  const gamification = useGamification();
  const weekly = useWeeklyChallenge();
  const monthly = useMonthlyChallenge();
  const quests = useQuests();
  const posthog = usePostHog();

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithCategory | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [unlockQueue, setUnlockQueue] = useState<string[]>([]);
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.current_balance, 0),
    [accounts]
  );

  const { monthIncome, monthExpense } = useMemo(() => {
    const monthStart = startOfMonth(new Date()).getTime();
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      const t = new Date(tx.transaction_date).getTime();
      if (t < monthStart || tx.transfer_id) continue;
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    }
    return { monthIncome: income, monthExpense: expense };
  }, [transactions]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 4),
    [transactions]
  );

  const overspendBudget = useMemo(() => {
    const first = overspentBudgets[0];
    if (!first || !first.budgetLimit) return undefined;
    return {
      name: first.category.name,
      overshoot: first.spent - first.budgetLimit,
    };
  }, [overspentBudgets]);

  useDashboardFocus({
    refreshAccounts,
    refreshTransactions,
    refreshBudgets,
    checkNew,
    gamification,
    weekly,
    monthly,
    quests,
    onUnlocks: setUnlockQueue,
    onLevelUp: setLevelUp,
  });

  const handleCreateAccount = async (params: Parameters<typeof createAccount>[0]) => {
    const result = await createAccount(params);
    if (result.success) {
      posthog.capture('account_created', { account_type: params.type });
      setShowAddAccount(false);
    }
    return result;
  };
  const getAccountName = (a: AccountWithBalance): string =>
    a.is_default === 1
      ? a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')
      : a.name;
  const now = new Date();

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || accountsLoading}
            onRefresh={async () => {
              await Promise.all([refreshAccounts(), refreshTransactions(), refreshBudgets()]);
            }}
            tintColor={v2.brand}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <DashboardHeader
            dateLabel={formatDateLabelFr(now, i18n.language)}
            hasNotification={hasNew}
            onNotificationPress={() => router.push('/whats-new' as any)}
            onAchievementsPress={() => router.push('/(tabs)/achievements')}
            onGiftPress={() => router.push('/other-apps' as any)}
          />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          {!appLockEnabled && !appLockBanner.dismissed ? (
            <AppLockBanner
              onPress={() => router.push('/settings/privacy' as any)}
              onDismiss={appLockBanner.dismiss}
            />
          ) : null}

          <CloudBackupSurveyPrompt />


          <BalanceHeroCard
            totalBalance={totalBalance}
            accountsCount={accounts.length}
            monthIncome={monthIncome}
            monthExpense={monthExpense}
            balanceHidden={balanceHidden}
            onToggleBalance={toggleBalanceVisibility}
            overspendBudget={overspendBudget}
            onOverspendPress={() => router.push('/history')}
            currencyCode={currency.code}
          />

          <StreakXPStrip
            streakDays={gamification.currentStreak}
            level={calculateLevel(gamification.totalXP)}
            xpToNext={xpToNextLevel(gamification.totalXP)}
            xpProgressPct={Math.round(xpProgress(gamification.totalXP) * 100)}
            onPress={() => router.push('/(tabs)/achievements')}
          />

          <View style={{ marginTop: 22 }}>
            <AccountsCarousel
              accounts={accounts}
              balanceHidden={balanceHidden}
              onAddPress={() => {
                if (canCreateAccount) setShowAddAccount(true);
                else setLockedFeature('account');
              }}
              getAccountName={getAccountName}
              currencyCode={currency.code}
            />
          </View>

          <View style={{ marginTop: 24 }}>
            <BudgetsCard
              monthLabel={formatMonthLabelFr(now, i18n.language)}
              budgets={topBudgets}
              onSeeAllPress={() => router.push('/history')}
            />
          </View>

          <View style={{ marginTop: 24 }}>
            <RecentTransactionsCard
              transactions={recentTransactions}
              onSeeAllPress={() => router.push('/transactions')}
              onTransactionLongPress={(tx) => setDeleteTarget(tx)}
              currencyCode={currency.code}
            />
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!deleteTarget} title={t('history.deleteConfirm')}
        message={t('history.deleteMessage')} confirmText={t('common.delete')}
        isDestructive onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            posthog.capture('transaction_deleted', { transaction_type: deleteTarget.type, source: 'dashboard' });
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
      <FeatureUnlockedModal
        unlockKey={unlockQueue[0] ?? null}
        onClose={() => setUnlockQueue((q) => q.slice(1))}
      />
      <LockedFeatureModal
        feature={lockedFeature}
        onClose={() => setLockedFeature(null)}
      />
    </View>
  );
}
