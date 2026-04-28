import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import {
  useTransactions,
  useAccounts,
  useGamification,
  useWeeklyChallenge,
  useMonthlyChallenge,
  useStoreReview,
  SYSTEM_CATEGORY_INCOME_ID,
} from './index';
import { XP_VALUES } from '@/constants/badges';
import { useCurrency } from '@/stores/settingsStore';
import { parseAmount, getNumericValue } from '@/lib/amountInput';
import type { TxMode, TxType } from '@/components/add';
import type { Category } from '@/types';

export interface BudgetWarningPayload {
  categoryName: string;
  spent: string;
  limit: string;
  percentage: number;
  overAmount?: string;
}

interface Form {
  mode: TxMode;
  type: TxType;
  amount: string;
  categoryId: string | null;
  accountId: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  note: string;
}

interface Callbacks {
  onSuccess: () => void;
  onError: (msg: string) => void;
  onXP: (xp: number) => void;
  onLevelUp: (level: number) => void;
  onBudgetWarning: (w: BudgetWarningPayload) => void;
}

export function useAddTransactionSave(expenseCategories: Category[]) {
  const db = useSQLiteContext();
  const currency = useCurrency();
  const { createTransaction, isLoading } = useTransactions();
  const { refresh: refreshAccounts, createTransfer, formatMoney } = useAccounts();
  const gamification = useGamification();
  const weekly = useWeeklyChallenge();
  const monthly = useMonthlyChallenge();
  const { incrementAndCheck: checkStoreReview } = useStoreReview();
  const posthog = usePostHog();

  const checkBudgetAndSave = async (form: Form, cb: Callbacks) => {
    if (getNumericValue(form.amount) <= 0) return;
    const amountValue = parseAmount(form.amount);
    if (form.mode === 'transaction' && form.type === 'expense' && form.categoryId) {
      const cat = expenseCategories.find((c) => c.id === form.categoryId);
      if (cat?.budget_limit) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        const result = await db.getFirstAsync<{ total: number }>(
          `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
           WHERE category_id = ? AND type = 'expense' AND deleted_at IS NULL
             AND transfer_id IS NULL AND created_at >= ? AND created_at < ?`,
          [form.categoryId, monthStart, monthEnd]
        );
        const currentSpent = result?.total ?? 0;
        const newTotal = currentSpent + amountValue;
        const percentage = Math.round((newTotal / cat.budget_limit) * 100);
        if (percentage >= 70) {
          cb.onBudgetWarning({
            categoryName: cat.name,
            spent: formatMoney(newTotal),
            limit: formatMoney(cat.budget_limit),
            percentage,
            overAmount: newTotal > cat.budget_limit ? formatMoney(newTotal - cat.budget_limit) : undefined,
          });
          return;
        }
      }
    }
    await executeSave(form, cb);
  };

  const executeSave = async (form: Form, cb: Callbacks) => {
    if (getNumericValue(form.amount) <= 0) return;
    const amountValue = parseAmount(form.amount);
    if (form.mode === 'transaction') {
      if (!form.accountId) return;
      const finalCategoryId =
        form.type === 'income' ? SYSTEM_CATEGORY_INCOME_ID : form.categoryId;
      const result = await createTransaction({
        type: form.type,
        amount: amountValue,
        categoryId: finalCategoryId,
        accountId: form.accountId,
        note: form.note.trim() || null,
      });
      if (!result.success) {
        if (result.error) cb.onError(result.error);
        return;
      }
      posthog.capture('transaction_created', {
        transaction_type: form.type,
        has_note: !!form.note.trim(),
        currency: currency.code,
      });
      cb.onSuccess();
      refreshAccounts();
      let xp = 0;
      const xpResult = await gamification.awardXP(
        form.type === 'income' ? XP_VALUES.INCOME : XP_VALUES.EXPENSE
      );
      xp += xpResult.xpGained;
      await gamification.recordActivity();
      if (form.type === 'expense') xp += await gamification.checkDailyChallenge('log_expense');
      if (form.type === 'income') xp += await gamification.checkDailyChallenge('log_income');
      xp += await gamification.checkDailyChallenge('log_3_transactions');
      xp += await gamification.tryCompleteDailyChallenge();
      xp += await weekly.refreshProgress();
      xp += await monthly.refreshProgress();
      await gamification.checkBadges();
      cb.onXP(xp);
      const level = gamification.getLevelUp();
      if (level) cb.onLevelUp(level);
      await checkStoreReview();
    } else {
      if (!form.fromAccountId || !form.toAccountId) return;
      const result = await createTransfer({
        fromAccountId: form.fromAccountId,
        toAccountId: form.toAccountId,
        amount: amountValue,
        note: form.note.trim() || undefined,
      });
      if (!result.success) {
        if (result.error) cb.onError(result.error);
        return;
      }
      posthog.capture('transfer_created', {
        has_note: !!form.note.trim(),
        currency: currency.code,
      });
      cb.onSuccess();
      refreshAccounts();
      let xp = 0;
      const xpResult = await gamification.awardXP(XP_VALUES.TRANSFER);
      xp += xpResult.xpGained;
      await gamification.recordActivity();
      xp += await gamification.checkDailyChallenge('log_3_transactions');
      xp += await weekly.refreshProgress();
      xp += await monthly.refreshProgress();
      await gamification.checkBadges();
      cb.onXP(xp);
      const level = gamification.getLevelUp();
      if (level) cb.onLevelUp(level);
      await checkStoreReview();
    }
  };

  return { checkBudgetAndSave, executeSave, isLoading, formatMoney };
}
