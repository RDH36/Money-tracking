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
import type { LockedFeature } from '@/components/LockedFeatureModal';
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
  DashboardModals,
  pickOverspend,
  accountDisplayName,
} from '@/components/dashboard';
import { CloudBackupSurveyPrompt } from '@/components/cloud-backup-survey/CloudBackupSurveyPrompt';
import { AnalysisEntryCard } from '@/components/analysis';
import { CycleConfirmCard, sumCycleTotals } from '@/components/cycle';
import { useAnalysisEntry } from '@/hooks/useAnalysisEntry';
import { useIntroMoisAutoOpen } from '@/hooks/useIntroMois';
import { useCycleSettings } from '@/hooks/useCycleSettings';
import { getCurrentCycle, formatCycleRange } from '@/lib/analysis/cycle';
import { useV2 } from '@/constants/designTokensV2';
import { ANALYSIS_ENABLED } from '@/constants/app';
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
  const { topBudgets, overspentBudgets, refresh: refreshBudgets, elapsedRatio } = useBudgets();
  const { visible: analysisEntryVisible } = useAnalysisEntry();
  // Intro « Ton mois » (Phase 8) : auto-ouverte une fois, puis porte d'entrée.
  const intro = useIntroMoisAutoOpen(analysisEntryVisible);
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

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.current_balance, 0), [accounts]);

  // Cycle personnel (Phase 7) : le hero suit les bornes du cycle, pas le mois.
  const { settings: cycleSettings, isConfirmed: cycleConfirmed } = useCycleSettings();
  const cycle = useMemo(() => getCurrentCycle(new Date(), cycleSettings), [cycleSettings]);
  const { monthIncome, monthExpense } = useMemo(
    () => sumCycleTotals(transactions, cycle),
    [transactions, cycle]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);
  const overspendBudget = useMemo(() => pickOverspend(overspentBudgets), [overspentBudgets]);

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
  const getAccountName = (a: AccountWithBalance): string => accountDisplayName(a, t);
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
            cycleLabel={formatCycleRange(cycle, i18n.language)}
          />

          {ANALYSIS_ENABLED && intro.seen && !cycleConfirmed ? <CycleConfirmCard /> : null}

          {analysisEntryVisible ? (
            <View style={{ marginTop: 16 }}>
              <AnalysisEntryCard
                onPress={() => router.push((intro.seen ? '/analysis' : '/intro-mois') as any)}
              />
            </View>
          ) : null}

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
              elapsedRatio={elapsedRatio}
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

      <DashboardModals
        deleteTarget={deleteTarget}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={(tx) => {
          posthog.capture('transaction_deleted', { transaction_type: tx.type, source: 'dashboard' });
          deleteTransaction(tx.id);
          refreshAccounts();
        }}
        showAddAccount={showAddAccount}
        onCloseAddAccount={() => setShowAddAccount(false)}
        onCreateAccount={handleCreateAccount}
        canCreateAccount={canCreateAccount}
        customAccountsCount={customAccountsCount}
        maxCustomAccounts={maxCustomAccounts}
        levelUp={levelUp}
        onCloseLevelUp={() => setLevelUp(null)}
        unlockKey={unlockQueue[0] ?? null}
        onCloseUnlock={() => setUnlockQueue((q) => q.slice(1))}
        lockedFeature={lockedFeature}
        onCloseLocked={() => setLockedFeature(null)}
      />
    </View>
  );
}
