import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { SYSTEM_CATEGORY_TRANSFER_ID, MAX_CUSTOM_ACCOUNTS } from '@/lib/database/schema';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { getAccountSlotBonus } from '@/lib/gamification/unlocks';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyCode } from '@/stores/settingsStore';
import type { Account, AccountWithBalance, AccountType } from '@/types';

export { MAX_CUSTOM_ACCOUNTS };

interface CreateAccountParams {
  name: string;
  type: AccountType;
  initialBalance: number;
  icon: string;
}

interface TransferParams {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useAccounts() {
  const db = useSQLiteContext();
  const currencyCode = useCurrencyCode();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Account & { total_income: number; total_expense: number }>(
        `SELECT
          a.*,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
        GROUP BY a.id
        ORDER BY a.created_at ASC`
      );

      const accountsWithBalance: AccountWithBalance[] = result.map((acc) => ({
        ...acc,
        current_balance: acc.initial_balance + acc.total_income - acc.total_expense,
      }));

      setAccounts(accountsWithBalance);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const accountsVersion = useDataRefreshStore((s) => s.accountsVersion);
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, accountsVersion]);

  // Custom accounts are those with is_default = 0
  const customAccounts = useMemo(
    () => accounts.filter((acc) => acc.is_default === 0),
    [accounts]
  );

  const customAccountsCount = customAccounts.length;
  const unlockBonus = useUnlocksStore((s) => getAccountSlotBonus(s.unlocks));
  const maxCustomAccountsEffective = MAX_CUSTOM_ACCOUNTS + unlockBonus;
  const canCreateAccount = customAccountsCount < maxCustomAccountsEffective;

  const createAccount = useCallback(
    async ({ name, type, initialBalance, icon }: CreateAccountParams) => {
      if (!canCreateAccount) {
        return { success: false, id: null, limitReached: true };
      }

      try {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO accounts (id, name, type, initial_balance, icon, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
          [id, name, type, initialBalance, icon, now, now]
        );

        useDataRefreshStore.getState().bumpAccounts();
        return { success: true, id, limitReached: false };
      } catch (error) {
        console.error('Error creating account:', error);
        return { success: false, id: null, limitReached: false };
      }
    },
    [db, fetchAccounts, canCreateAccount]
  );

  const createTransfer = useCallback(
    async ({ fromAccountId, toAccountId, amount, note }: TransferParams) => {
      try {
        // Check if source account has sufficient balance by querying the database
        const fromAccountResult = await db.getFirstAsync<{
          initial_balance: number;
          total_income: number;
          total_expense: number;
        }>(
          `SELECT
            a.initial_balance,
            COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
          FROM accounts a
          LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
          WHERE a.id = ? AND a.deleted_at IS NULL
          GROUP BY a.id`,
          [fromAccountId]
        );

        if (!fromAccountResult) {
          return { success: false, transferId: null, error: 'errors.sourceAccountNotFound' };
        }

        const currentBalance = fromAccountResult.initial_balance + fromAccountResult.total_income - fromAccountResult.total_expense;
        if (currentBalance < amount) {
          return { success: false, transferId: null, error: 'errors.insufficientBalance' };
        }

        const now = new Date().toISOString();
        const transferId = generateId();
        const expenseId = generateId();
        const incomeId = generateId();

        await db.withTransactionAsync(async () => {
          await db.runAsync(
            `INSERT INTO transactions (id, type, amount, category_id, account_id, transfer_id, note, created_at, transaction_date, updated_at, sync_status)
             VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [expenseId, amount, SYSTEM_CATEGORY_TRANSFER_ID, fromAccountId, transferId, note || 'Transfert', now, now, now]
          );

          await db.runAsync(
            `INSERT INTO transactions (id, type, amount, category_id, account_id, transfer_id, note, created_at, transaction_date, updated_at, sync_status)
             VALUES (?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [incomeId, amount, SYSTEM_CATEGORY_TRANSFER_ID, toAccountId, transferId, note || 'Transfert', now, now, now]
          );
        });

        useDataRefreshStore.getState().bumpAll();
        return { success: true, transferId };
      } catch (error) {
        console.error('Error creating transfer:', error);
        return { success: false, transferId: null, error: 'errors.transferFailed' };
      }
    },
    [db, fetchAccounts]
  );

  const deleteAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        await db.runAsync(
          'UPDATE accounts SET deleted_at = ?, updated_at = ? WHERE id = ? AND is_default = 0',
          [now, now, id]
        );
        return true;
      } catch (error) {
        console.error('Error deleting account:', error);
        fetchAccounts();
        return false;
      }
    },
    [db, fetchAccounts]
  );

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  }, [accounts]);

  const convertAllBalances = useCallback(
    async (rate: number): Promise<boolean> => {
      try {
        const now = new Date().toISOString();

        await db.withTransactionAsync(async () => {
          await db.runAsync(
            'UPDATE accounts SET initial_balance = ROUND(initial_balance * ?), updated_at = ? WHERE deleted_at IS NULL',
            [rate, now]
          );

          await db.runAsync(
            'UPDATE transactions SET amount = ROUND(amount * ?), updated_at = ? WHERE deleted_at IS NULL',
            [rate, now]
          );

          await db.runAsync(
            'UPDATE planification_items SET amount = ROUND(amount * ?)',
            [rate]
          );
        });

        await fetchAccounts();
        return true;
      } catch (error) {
        console.error('Error converting balances:', error);
        return false;
      }
    },
    [db, fetchAccounts]
  );

  const getAccountById = useCallback(
    (id: string) => accounts.find((acc) => acc.id === id),
    [accounts]
  );

  const formatMoney = useCallback((amount: number) => {
    return formatCurrency(amount, currencyCode);
  }, [currencyCode]);

  return {
    accounts,
    customAccounts,
    isLoading,
    refresh: fetchAccounts,
    createAccount,
    deleteAccount,
    createTransfer,
    getTotalBalance,
    getAccountById,
    formatMoney,
    formattedTotal: formatCurrency(getTotalBalance(), currencyCode),
    customAccountsCount,
    canCreateAccount,
    maxCustomAccounts: maxCustomAccountsEffective,
    convertAllBalances,
  };
}
