import { useState, useCallback } from 'react';
import { View, Pressable, Text as RNText, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CategoryPicker } from '@/components/CategoryPicker';
import { AccountPicker } from '@/components/AccountPicker';
import { TransferForm } from '@/components/TransferForm';
import { BudgetWarningDialog } from '@/components/BudgetWarningDialog';
import { PrimaryButton, PremiumInput, Divider } from '@/components/premium';
import { useCategories, useTransactions, useAccounts, useTips, useGamification, useWeeklyChallenge, useMonthlyChallenge, useStoreReview, SYSTEM_CATEGORY_INCOME_ID } from '@/hooks';
import { useSQLiteContext } from '@/lib/database';
import { useTheme } from '@/contexts';
import { usePostHog } from 'posthog-react-native';
import { XPToast } from '@/components/XPToast';
import { LevelUpModal } from '@/components/LevelUpModal';
import { XP_VALUES } from '@/constants/badges';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, parseAmount, getNumericValue } from '@/lib/amountInput';
import { cn } from '@/lib/utils';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import type { TransactionType } from '@/types';

type ScreenMode = 'transaction' | 'transfer';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const currency = useCurrency();
  const { expenseCategories, incomeCategory, refresh: refreshCategories } = useCategories();
  const { createTransaction, isLoading } = useTransactions();
  const { accounts, refresh: refreshAccounts, createTransfer, formatMoney } = useAccounts();
  const { currentTip, showTip } = useTips('add');
  const gamification = useGamification();
  const weekly = useWeeklyChallenge();
  const monthly = useMonthlyChallenge();
  const { incrementAndCheck: checkStoreReview } = useStoreReview();
  const posthog = usePostHog();
  const isDark = useEffectiveColorScheme() === 'dark';
  const colors = getDarkModeColors(isDark);

  const [mode, setMode] = useState<ScreenMode>('transaction');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<{
    categoryName: string; spent: string; limit: string; percentage: number; overAmount?: string;
  } | null>(null);
  const addDb = useSQLiteContext();

  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshCategories();
    }, [refreshAccounts, refreshCategories])
  );

  const getNumericAmount = () => getNumericValue(amount);

  const resetForm = () => {
    setAmount('');
    setCategoryId(null);
    setAccountId(null);
    setFromAccountId(null);
    setToAccountId(null);
    setNote('');
    setError(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const checkBudgetAndSave = async () => {
    const numericAmount = getNumericAmount();
    if (numericAmount <= 0) return;
    const amountValue = parseAmount(amount);

    if (mode === 'transaction' && type === 'expense' && categoryId) {
      const cat = expenseCategories.find((c) => c.id === categoryId);
      if (cat?.budget_limit) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        const result = await addDb.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE category_id = ? AND type = 'expense' AND deleted_at IS NULL
             AND transfer_id IS NULL AND created_at >= ? AND created_at < ?`,
          [categoryId, monthStart, monthEnd]
        );
        const currentSpent = result?.total ?? 0;
        const newTotal = currentSpent + amountValue;
        const percentage = Math.round((newTotal / cat.budget_limit) * 100);
        if (percentage >= 70) {
          const overAmount = newTotal > cat.budget_limit ? formatMoney(newTotal - cat.budget_limit) : undefined;
          setBudgetWarning({
            categoryName: cat.name, spent: formatMoney(newTotal),
            limit: formatMoney(cat.budget_limit), percentage, overAmount,
          });
          return;
        }
      }
    }
    await executeSave();
  };

  const executeSave = async () => {
    const numericAmount = getNumericAmount();
    if (numericAmount <= 0) return;
    const amountValue = parseAmount(amount);
    setError(null);
    setBudgetWarning(null);

    if (mode === 'transaction') {
      if (!accountId) return;
      const finalCategoryId = type === 'income' ? SYSTEM_CATEGORY_INCOME_ID : categoryId;
      const result = await createTransaction({
        type,
        amount: amountValue,
        categoryId: finalCategoryId,
        accountId,
        note: note.trim() || null,
      });
      if (result.success) {
        posthog.capture('transaction_created', {
          transaction_type: type,
          has_note: !!note.trim(),
          currency: currency.code,
        });
        resetForm();
        refreshAccounts();
        // Gamification: income gives more XP than expense
        let totalXPGained = 0;
        const xpAmount = type === 'income' ? XP_VALUES.INCOME : XP_VALUES.EXPENSE;
        const xpResult = await gamification.awardXP(xpAmount);
        totalXPGained += xpResult.xpGained;
        await gamification.recordActivity();
        if (type === 'expense') totalXPGained += await gamification.checkDailyChallenge('log_expense');
        if (type === 'income') totalXPGained += await gamification.checkDailyChallenge('log_income');
        totalXPGained += await gamification.checkDailyChallenge('log_3_transactions');
        // Validate active challenges that depend on live state (log_before_noon, categorize_all)
        totalXPGained += await gamification.tryCompleteDailyChallenge();
        totalXPGained += await weekly.refreshProgress();
        totalXPGained += await monthly.refreshProgress();
        await gamification.checkBadges();
        setXpToast(totalXPGained);
        const level = gamification.getLevelUp();
        if (level) setLevelUp(level);
        await checkStoreReview();
      } else if (result.error) {
        setError(result.error);
      }
    } else {
      if (!fromAccountId || !toAccountId) return;
      const result = await createTransfer({
        fromAccountId,
        toAccountId,
        amount: amountValue,
        note: note.trim() || undefined,
      });
      if (result.success) {
        posthog.capture('transfer_created', {
          has_note: !!note.trim(),
          currency: currency.code,
        });
        resetForm();
        refreshAccounts();
        // Gamification: award XP for transfer
        let totalXPGained = 0;
        const xpResult = await gamification.awardXP(XP_VALUES.TRANSFER);
        totalXPGained += xpResult.xpGained;
        await gamification.recordActivity();
        totalXPGained += await gamification.checkDailyChallenge('log_3_transactions');
        totalXPGained += await weekly.refreshProgress();
        totalXPGained += await monthly.refreshProgress();
        await gamification.checkBadges();
        setXpToast(totalXPGained);
        const level = gamification.getLevelUp();
        if (level) setLevelUp(level);
        await checkStoreReview();
      } else if (result.error) {
        setError(result.error);
      }
    }
  };

  const isValidTransaction = getNumericAmount() > 0 && accountId;
  const isValidTransfer = getNumericAmount() > 0 && fromAccountId && toAccountId && fromAccountId !== toAccountId;
  const isValid = mode === 'transaction' ? isValidTransaction : isValidTransfer;

  return (
    <View className="flex-1 bg-bg-base" style={{ paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        bottomOffset={20}
      >
          <View className="flex-1 p-6 pb-4">
            <View className="flex-1 gap-6">
              <RNText className="font-display text-display-md text-content-primary">
                {mode === 'transaction' ? t('add.newTransaction') : t('add.transfer')}
              </RNText>

              <View>
                <View className="bg-bg-raised p-1 rounded-xl">
                  <View className="flex-row">
                    <Pressable onPress={() => { setMode('transaction'); setError(null); }} className="flex-1">
                      <View
                        className={cn('py-3 rounded-lg items-center', mode === 'transaction' ? 'bg-brand' : '')}
                      >
                        <View className="flex-row gap-2 items-center">
                          <Ionicons
                            name="receipt-outline"
                            size={18}
                            color={mode === 'transaction' ? '#FFFFFF' : '#8E8EA0'}
                          />
                          <RNText
                            className="font-ui font-semibold"
                            style={{ color: mode === 'transaction' ? '#FFFFFF' : '#8E8EA0' }}
                          >
                            {t('add.transaction')}
                          </RNText>
                        </View>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => { setMode('transfer'); setError(null); }} className="flex-1">
                      <View
                        className={cn('py-3 rounded-lg items-center', mode === 'transfer' ? 'bg-income' : '')}
                      >
                        <View className="flex-row gap-2 items-center">
                          <Ionicons
                            name="swap-horizontal-outline"
                            size={18}
                            color={mode === 'transfer' ? '#FFFFFF' : '#8E8EA0'}
                          />
                          <RNText
                            className="font-ui font-semibold"
                            style={{ color: mode === 'transfer' ? '#FFFFFF' : '#8E8EA0' }}
                          >
                            {t('add.transfer')}
                          </RNText>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                </View>
                {showTip && currentTip && (
                <View className="mt-2 p-3 rounded-xl flex-row items-center bg-bg-surface gap-2">
                  <Ionicons name="bulb" size={16} color="#8B5CF6" />
                  <RNText className="flex-1 text-xs text-brand">{t(currentTip)}</RNText>
                </View>
              )}
              </View>

              {mode === 'transaction' && (
                <View className="flex-row gap-2 justify-center">
                  <Pressable onPress={() => setType('expense')} className="flex-1">
                    <View
                      className={cn('py-3 px-4 rounded-xl items-center', type === 'expense' ? 'bg-expense-soft' : 'bg-bg-raised')}
                    >
                      <View className="flex-row gap-2 items-center">
                        <Ionicons
                          name="arrow-down-circle"
                          size={20}
                          color={type === 'expense' ? '#EF4444' : '#8E8EA0'}
                        />
                        <RNText
                          className="font-ui font-semibold"
                          style={{ color: type === 'expense' ? '#EF4444' : '#8E8EA0' }}
                        >
                          {t('add.expense')}
                        </RNText>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setType('income')} className="flex-1">
                    <View
                      className={cn('py-3 px-4 rounded-xl items-center', type === 'income' ? 'bg-income-soft' : 'bg-bg-raised')}
                    >
                      <View className="flex-row gap-2 items-center">
                        <Ionicons
                          name="arrow-up-circle"
                          size={20}
                          color={type === 'income' ? '#22C55E' : '#8E8EA0'}
                        />
                        <RNText
                          className="font-ui font-semibold"
                          style={{ color: type === 'income' ? '#22C55E' : '#8E8EA0' }}
                        >
                          {t('add.income')}
                        </RNText>
                      </View>
                    </View>
                  </Pressable>
                </View>
              )}

              <View className="py-4 items-center">
                <RNText className="text-ui-sm mb-2" style={{ color: '#8E8EA0' }}>{t('add.amount')} ({currency.code})</RNText>
                <TextInput
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={(text) => { setAmount(formatAmountInput(text)); setSuccess(false); setError(null); }}
                  className="text-4xl text-center font-display w-full max-w-[250px]"
                  style={{ color: isDark ? '#EDEDF0' : '#14141A' }}
                  placeholderTextColor={'#8E8EA0'}
                />
                <Divider className="mt-2 w-full max-w-[250px]" />
              </View>

              {mode === 'transaction' ? (
                <>
                  <View className="gap-2">
                    <RNText className="font-ui text-ui-md" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('add.account')}</RNText>
                    <AccountPicker accounts={accounts} selectedId={accountId} onSelect={setAccountId} formatMoney={formatMoney} />
                  </View>
                  {type === 'expense' ? (
                    <View className="gap-2">
                      <RNText className="font-ui text-ui-md" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('add.category')}</RNText>
                      <CategoryPicker categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} />
                    </View>
                  ) : (
                    <View className="gap-2">
                      <RNText className="font-ui text-ui-md" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('add.category')}</RNText>
                      <View className="p-3 rounded-xl bg-income-soft">
                        <View className="flex-row gap-3 items-center">
                          <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: incomeCategory?.color || '#22C55E' }}>
                            <Ionicons name={(incomeCategory?.icon as keyof typeof Ionicons.glyphMap) || 'trending-up'} size={20} color="white" />
                          </View>
                          <RNText className="font-ui font-medium" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('add.income')}</RNText>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <TransferForm
                  accounts={accounts}
                  fromAccountId={fromAccountId}
                  toAccountId={toAccountId}
                  onFromChange={setFromAccountId}
                  onToChange={setToAccountId}
                />
              )}

              <View className="gap-2">
                <RNText className="font-ui text-ui-md" style={{ color: isDark ? '#EDEDF0' : '#14141A' }}>{t('add.noteOptional')}</RNText>
                <PremiumInput placeholder={t('add.notePlaceholder')} value={note} onChangeText={setNote} maxLength={20} />
                <RNText className="text-ui-xs text-right" style={{ color: colors.textMuted }}>{t('common.characters', { current: note.length, max: 20 })}</RNText>
              </View>

              {success && (
                <View className="bg-income-soft p-3 rounded-xl">
                  <RNText className="text-income font-ui text-center">
                    {mode === 'transaction' ? t('add.transactionSaved') : t('add.transferSaved')}
                  </RNText>
                </View>
              )}

              {error && (
                <View className="bg-error-soft p-3 rounded-xl">
                  <RNText className="text-error font-ui text-center">
                    {t(error)}
                  </RNText>
                </View>
              )}
            </View>

            <PrimaryButton
              label={isLoading ? t('add.saving') : t('common.save')}
              onPress={checkBudgetAndSave}
              disabled={!isValid || isLoading}
              isLoading={isLoading}
            />
          </View>
      </KeyboardAwareScrollView>
      <XPToast xpAmount={xpToast} onHide={() => setXpToast(null)} />
      <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />
      <BudgetWarningDialog
        isOpen={!!budgetWarning}
        categoryName={budgetWarning?.categoryName || ''}
        spent={budgetWarning?.spent || ''}
        limit={budgetWarning?.limit || ''}
        percentage={budgetWarning?.percentage || 0}
        overAmount={budgetWarning?.overAmount}
        onClose={() => setBudgetWarning(null)}
        onContinue={executeSave}
      />
    </View>
  );
}
