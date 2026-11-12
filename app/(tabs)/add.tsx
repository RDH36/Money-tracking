import { useState, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCategories, useAccounts, useTips } from '@/hooks';
import { useBudgetPreview } from '@/hooks/useBudgetPreview';
import { useFirstExpenseActivation } from '@/hooks/useFirstExpenseActivation';
import { useAddTransactionSave, type BudgetWarningPayload } from '@/hooks/useAddTransactionSave';
import { XPToast } from '@/components/XPToast';
import { LevelUpModal } from '@/components/LevelUpModal';
import { BudgetWarningDialog } from '@/components/BudgetWarningDialog';
import { useCurrency } from '@/stores/settingsStore';
import { formatAmountInput, getNumericValue } from '@/lib/amountInput';
import { useV2 } from '@/constants/designTokensV2';
import { AddScreenTop } from '@/components/habit/AddScreenTop';
import { DeferConfirmSheet } from '@/components/habit/DeferConfirmSheet';
import { useAddEntryMode } from '@/hooks/habit/useAddEntryMode';
import { useDeferReminder } from '@/hooks/habit/useDeferReminder';
import { AddTipCard } from '@/components/add/feedback/AddTipCard';
import { AddSaveFeedback } from '@/components/add/feedback/AddSaveFeedback';
import { AddSaveButton } from '@/components/add/feedback/AddSaveButton';
import {
  ModeToggle, TypePills, AmountDisplay,
  ThresholdPreviewCard, AccountPickerV2, CategoryQuickGrid,
  CategorySelectSheet, TransferFormV2, IncomeCategoryCard, NoteField, DateField,
  type TxMode, type TxType,
} from '@/components/add';
import type { AccountWithBalance } from '@/types';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const v2 = useV2();
  const currency = useCurrency();
  // Source d'arrivée (onboarding, rappel du soir) : mode de l'écran + mesure.
  const { mode: entryMode, source } = useAddEntryMode();
  const deferral = useDeferReminder();
  const { expenseCategories, incomeCategory, refresh: refreshCategories } = useCategories();
  const { accounts, refresh: refreshAccounts } = useAccounts();
  const { currentTip, showTip } = useTips('add');
  const save = useAddTransactionSave(expenseCategories);

  const [mode, setMode] = useState<TxMode>('transaction');
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(() => new Date());
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<BudgetWarningPayload | null>(null);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshAccounts(); refreshCategories();
  }, [refreshAccounts, refreshCategories]));

  const { trackAmountFirstEntered } = useFirstExpenseActivation({
    source, accounts, accountId, setAccountId,
  });
  const handleAmountChange = (text: string) => {
    const formatted = formatAmountInput(text);
    setAmount(formatted); setError(null);
    if (getNumericValue(formatted) > 0) trackAmountFirstEntered();
  };

  const topExpenseCategories = useMemo(() =>
    [...expenseCategories]
      .sort((a, b) => (b.is_default - a.is_default) || a.name.localeCompare(b.name))
      .slice(0, 7),
    [expenseCategories]
  );

  const budgetPreview = useBudgetPreview({
    active: mode === 'transaction' && type === 'expense',
    amount, categoryId, expenseCategories,
    formatMoney: save.formatMoney,
    date,
  });

  const getAccountName = (a: AccountWithBalance): string =>
    a.is_default === 1
      ? a.type === 'bank' ? t('account.defaultBank') : t('account.defaultCash')
      : a.name;

  const resetForm = () => {
    setAmount(''); setCategoryId(null); setAccountId(null);
    setFromAccountId(null); setToAccountId(null); setNote('');
    setDate(new Date());
    setError(null); setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const form = { mode, type, amount, categoryId, accountId, fromAccountId, toAccountId, note, date, source };
  const callbacks = {
    onSuccess: resetForm,
    onError: setError,
    onXP: setXpToast,
    onLevelUp: setLevelUp,
    onBudgetWarning: setBudgetWarning,
  };

  const handleSave = () => {
    setError(null); setBudgetWarning(null);
    save.checkBudgetAndSave(form, callbacks);
  };
  const handleContinueOverBudget = () => {
    setBudgetWarning(null);
    save.executeSave(form, callbacks);
  };

  const isValid = mode === 'transaction'
    ? getNumericValue(amount) > 0 && !!accountId
    : getNumericValue(amount) > 0 && !!fromAccountId && !!toAccountId && fromAccountId !== toAccountId;

  return (
    <View style={{ flex: 1, backgroundColor: v2.bgBase, paddingTop: insets.top }}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        bottomOffset={20}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <AddScreenTop mode={entryMode} formatMoney={save.formatMoney}
            deferBusy={deferral.busy} onDefer={deferral.defer} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
          <ModeToggle
            mode={mode}
            onChange={(m) => { setMode(m); setError(null); }}
            transactionLabel={t('add.transaction')}
            transferLabel={t('add.transfer')}
          />
          {mode === 'transaction' && (
            <TypePills type={type} onChange={setType}
              expenseLabel={t('add.expense')} incomeLabel={t('add.income')} />
          )}

          <AmountDisplay
            value={amount}
            onChangeText={handleAmountChange}
            currencyCode={currency.code}
            autoFocus={entryMode !== 'onboarding'}
          />

          {showTip && entryMode !== 'onboarding' && <AddTipCard tip={currentTip} mode={mode} type={type} />}

          {mode === 'transaction' ? (
            <>
              <AccountPickerV2
                accounts={accounts} selectedId={accountId} onSelect={setAccountId}
                formatMoney={save.formatMoney}
                label={t('add.account')}
                getAccountName={getAccountName}
              />
              {type === 'expense' ? (
                <CategoryQuickGrid
                  categories={topExpenseCategories} selectedId={categoryId}
                  onSelect={setCategoryId}
                  onMorePress={() => setShowCategorySheet(true)}
                  totalCount={expenseCategories.length}
                />
              ) : (
                <IncomeCategoryCard
                  incomeCategory={incomeCategory}
                  label={t('add.income')}
                  sectionLabel={t('add.category')}
                />
              )}
              {budgetPreview && (
                <ThresholdPreviewCard
                  spent={budgetPreview.spent}
                  limit={budgetPreview.limit}
                  percentage={budgetPreview.percentage}
                />
              )}
              <DateField
                date={date}
                onChange={setDate}
                label={t('add.date')}
                todayLabel={t('add.today')}
                yesterdayLabel={t('add.yesterday')}
                locale={i18n.language}
              />
            </>
          ) : (
            <TransferFormV2
              accounts={accounts}
              fromAccountId={fromAccountId} toAccountId={toAccountId}
              onFromChange={setFromAccountId} onToChange={setToAccountId}
              fromLabel={t('add.fromAccount')}
              toLabel={t('add.toAccount')}
              getAccountName={getAccountName}
            />
          )}

          <NoteField
            value={note}
            onChangeText={setNote}
            placeholder={t('add.notePlaceholder')}
            label={t('add.noteOptional')}
            maxLength={100}
          />

          <AddSaveFeedback
            successText={success ? t(mode === 'transaction' ? 'add.transactionSaved' : 'add.transferSaved') : null}
            errorText={error ? t(error) : null}
          />

          <AddSaveButton
            label={save.isLoading ? t('add.saving') : t('common.save')}
            disabled={!isValid || save.isLoading} onPress={handleSave} />
        </View>
      </KeyboardAwareScrollView>

      <CategorySelectSheet
        isOpen={showCategorySheet}
        categories={expenseCategories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategorySheet(false)}
      />
      <DeferConfirmSheet
        result={deferral.result}
        onDone={() => { deferral.clear(); router.navigate('/(tabs)'); }}
      />
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
        onContinue={handleContinueOverBudget}
      />
    </View>
  );
}
