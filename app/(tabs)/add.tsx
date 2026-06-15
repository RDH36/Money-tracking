import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import {
  AddTransactionHeader, ModeToggle, TypePills, AmountDisplay,
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
  // Source de l'écran (ex. 'onboarding') pour mesurer et segmenter l'activation.
  const { source } = useLocalSearchParams<{ source?: string }>();
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
          <AddTransactionHeader title={t('add.newTransaction')} />
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
          />

          {showTip && currentTip && (
            <View style={{ marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: v2.bgSurface,
                            borderWidth: 1, borderColor: v2.hairline, flexDirection: 'row',
                            alignItems: 'center', gap: 8 }}>
              <Ionicons name="bulb-outline" size={14} color={v2.brand} />
              <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 11, color: v2.inkMuted }}>
                {t(currentTip)}
              </Text>
            </View>
          )}

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

          {success && (
            <View style={{ marginTop: 12, backgroundColor: v2.goodSoft, padding: 12, borderRadius: 12 }}>
              <Text style={{ color: v2.good, fontFamily: v2.fontUI, textAlign: 'center' }}>
                {mode === 'transaction' ? t('add.transactionSaved') : t('add.transferSaved')}
              </Text>
            </View>
          )}
          {error && (
            <View style={{ marginTop: 12, backgroundColor: v2.badSoft, padding: 12, borderRadius: 12 }}>
              <Text style={{ color: v2.bad, fontFamily: v2.fontUI, textAlign: 'center' }}>{t(error)}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={!isValid || save.isLoading}
            style={{
              marginTop: 20, backgroundColor: v2.bgInk, borderRadius: 14, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !isValid || save.isLoading ? 0.5 : 1,
              shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 14, fontWeight: '700',
                            color: v2.inkOnDark, letterSpacing: 0.3 }}>
              {save.isLoading ? t('add.saving') : t('common.save')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={v2.inkOnDark} />
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      <CategorySelectSheet
        isOpen={showCategorySheet}
        categories={expenseCategories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategorySheet(false)}
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
