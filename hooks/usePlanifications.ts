import { useState, useCallback, useEffect } from 'react';
import { useSQLiteContext } from '@/lib/database';
import {
  schedulePlanificationDeadlineReminders,
  cancelPlanificationReminders,
  sendExpiredPlanificationNotification,
} from '@/lib/notifications';
import type {
  PlanificationWithTotal,
  PlanificationItemWithCategory,
  PlanificationStatus,
  TransactionType,
} from '@/types';
import type { TransactionWithCategory } from './useTransactions';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function usePlanifications() {
  const db = useSQLiteContext();
  const [planifications, setPlanifications] = useState<PlanificationWithTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchPlanifications = useCallback(async () => {
    try {
      setIsFetching(true);
      const result = await db.getAllAsync<PlanificationWithTotal>(
        `SELECT p.*,
         CASE WHEN p.status = 'completed' THEN
           COALESCE((SELECT SUM(CASE WHEN t.type = 'income' THEN -t.amount ELSE t.amount END) FROM transactions t WHERE t.planification_id = p.id AND t.deleted_at IS NULL), 0)
         ELSE
           COALESCE(SUM(CASE WHEN pi.type = 'income' THEN -pi.amount ELSE pi.amount END), 0)
         END as total,
         CASE WHEN p.status = 'completed' THEN
           COALESCE((SELECT SUM(CASE WHEN t.type != 'income' THEN t.amount ELSE 0 END) FROM transactions t WHERE t.planification_id = p.id AND t.deleted_at IS NULL), 0)
         ELSE
           COALESCE(SUM(CASE WHEN pi.type != 'income' OR pi.type IS NULL THEN pi.amount ELSE 0 END), 0)
         END as total_expenses,
         CASE WHEN p.status = 'completed' THEN
           COALESCE((SELECT SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) FROM transactions t WHERE t.planification_id = p.id AND t.deleted_at IS NULL), 0)
         ELSE
           COALESCE(SUM(CASE WHEN pi.type = 'income' THEN pi.amount ELSE 0 END), 0)
         END as total_income,
         CASE WHEN p.status = 'completed' THEN
           (SELECT COUNT(*) FROM transactions t WHERE t.planification_id = p.id AND t.deleted_at IS NULL)
         ELSE
           COUNT(pi.id)
         END as item_count
         FROM planifications p
         LEFT JOIN planification_items pi ON p.id = pi.planification_id
         WHERE p.deleted_at IS NULL
         GROUP BY p.id
         ORDER BY
           CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
           p.updated_at DESC`
      );
      setPlanifications(result);
    } catch (err) {
      console.error('Error fetching planifications:', err);
    } finally {
      setIsFetching(false);
    }
  }, [db]);

  useEffect(() => {
    fetchPlanifications();
  }, [fetchPlanifications]);

  const createPlanification = useCallback(
    async (title: string, deadline?: Date | null) => {
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const id = generateId();
        const deadlineStr = deadline ? deadline.toISOString() : null;

        await db.runAsync(
          `INSERT INTO planifications (id, title, status, deadline, created_at, updated_at)
           VALUES (?, ?, 'pending', ?, ?, ?)`,
          [id, title, deadlineStr, now, now]
        );

        if (deadline) {
          await schedulePlanificationDeadlineReminders(id, title, deadline);
        }

        fetchPlanifications();
        return { success: true, id };
      } catch (err) {
        console.error('Error creating planification:', err);
        return { success: false, id: null };
      } finally {
        setIsLoading(false);
      }
    },
    [db, fetchPlanifications]
  );

  const deletePlanification = useCallback(
    async (id: string) => {
      try {
        const now = new Date().toISOString();
        setPlanifications((prev) => prev.filter((p) => p.id !== id));
        await db.runAsync(
          'UPDATE planifications SET deleted_at = ?, updated_at = ? WHERE id = ?',
          [now, now, id]
        );
        await cancelPlanificationReminders(id);
        return true;
      } catch (err) {
        console.error('Error deleting planification:', err);
        fetchPlanifications();
        return false;
      }
    },
    [db, fetchPlanifications]
  );

  const updateDeadline = useCallback(
    async (id: string, title: string, deadline: Date | null) => {
      try {
        const now = new Date().toISOString();
        const deadlineStr = deadline ? deadline.toISOString() : null;
        await db.runAsync(
          'UPDATE planifications SET deadline = ?, updated_at = ? WHERE id = ?',
          [deadlineStr, now, id]
        );
        await cancelPlanificationReminders(id);
        if (deadline) {
          await schedulePlanificationDeadlineReminders(id, title, deadline);
        }
        fetchPlanifications();
        return true;
      } catch (err) {
        console.error('Error updating deadline:', err);
        return false;
      }
    },
    [db, fetchPlanifications]
  );

  const checkExpiredPlanifications = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const expired = await db.getAllAsync<{ id: string; title: string }>(
        `SELECT id, title FROM planifications
         WHERE status = 'pending'
         AND deadline IS NOT NULL
         AND deadline < ?
         AND deleted_at IS NULL`,
        [now]
      );
      for (const planif of expired) {
        await sendExpiredPlanificationNotification(planif.id, planif.title);
      }
    } catch (err) {
      console.error('Error checking expired planifications:', err);
    }
  }, [db]);

  const validatePlanification = useCallback(
    async (id: string, accountId: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const items = await db.getAllAsync<PlanificationItemWithCategory>(
          `SELECT pi.*, c.name as category_name, c.icon as category_icon, c.color as category_color
           FROM planification_items pi
           LEFT JOIN categories c ON pi.category_id = c.id
           WHERE pi.planification_id = ?`,
          [id]
        );

        // Calculate net expense (expenses - incomes) from planification items
        const totalExpenses = items
          .filter(item => (item.type || 'expense') === 'expense')
          .reduce((sum, item) => sum + item.amount, 0);
        const totalIncomes = items
          .filter(item => item.type === 'income')
          .reduce((sum, item) => sum + item.amount, 0);
        const netExpense = totalExpenses - totalIncomes;

        // Check if account has sufficient balance for net expenses
        if (netExpense > 0) {
          const accountResult = await db.getFirstAsync<{
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
            [accountId]
          );

          if (!accountResult) {
            return { success: false, error: 'errors.accountNotFound' };
          }

          const currentBalance = accountResult.initial_balance + accountResult.total_income - accountResult.total_expense;
          if (currentBalance < netExpense) {
            return { success: false, error: 'errors.insufficientBalance' };
          }
        }

        const now = new Date().toISOString();

        await db.withTransactionAsync(async () => {
          for (const item of items) {
            const transactionId = generateId();
            await db.runAsync(
              `INSERT INTO transactions (id, type, amount, category_id, account_id, note, planification_id, created_at, updated_at, sync_status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
              [transactionId, item.type || 'expense', item.amount, item.category_id, accountId, item.note, id, now, now]
            );
          }

          await db.runAsync(
            `UPDATE planifications SET status = 'completed', updated_at = ? WHERE id = ?`,
            [now, id]
          );
        });

        await cancelPlanificationReminders(id);
        fetchPlanifications();
        return { success: true };
      } catch (err) {
        console.error('Error validating planification:', err);
        return { success: false, error: 'errors.validationFailed' };
      } finally {
        setIsLoading(false);
      }
    },
    [db, fetchPlanifications]
  );

  return {
    planifications,
    createPlanification,
    deletePlanification,
    updateDeadline,
    validatePlanification,
    checkExpiredPlanifications,
    refresh: fetchPlanifications,
    isLoading,
    isFetching,
  };
}

export function usePlanificationDetail(planificationId: string | null) {
  const db = useSQLiteContext();
  const [items, setItems] = useState<PlanificationItemWithCategory[]>([]);
  const [linkedTransactions, setLinkedTransactions] = useState<TransactionWithCategory[]>([]);
  const [planification, setPlanification] = useState<PlanificationWithTotal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchData = useCallback(async () => {
    if (!planificationId) return;

    try {
      setIsFetching(true);

      const planifResult = await db.getFirstAsync<PlanificationWithTotal>(
        `SELECT p.*,
         COALESCE(SUM(CASE WHEN pi.type = 'income' THEN -pi.amount ELSE pi.amount END), 0) as total,
         COALESCE(SUM(CASE WHEN pi.type != 'income' OR pi.type IS NULL THEN pi.amount ELSE 0 END), 0) as total_expenses,
         COALESCE(SUM(CASE WHEN pi.type = 'income' THEN pi.amount ELSE 0 END), 0) as total_income,
         COUNT(pi.id) as item_count
         FROM planifications p
         LEFT JOIN planification_items pi ON p.id = pi.planification_id
         WHERE p.id = ? AND p.deleted_at IS NULL
         GROUP BY p.id`,
        [planificationId]
      );
      setPlanification(planifResult || null);

      const itemsResult = await db.getAllAsync<PlanificationItemWithCategory>(
        `SELECT pi.*, c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM planification_items pi
         LEFT JOIN categories c ON pi.category_id = c.id
         WHERE pi.planification_id = ?
         ORDER BY pi.created_at DESC`,
        [planificationId]
      );
      setItems(itemsResult);

      // Fetch linked transactions for completed planifications
      if (planifResult?.status === 'completed') {
        const txResult = await db.getAllAsync<TransactionWithCategory>(
          `SELECT t.*,
            c.name as category_name, c.icon as category_icon, c.color as category_color,
            a.name as account_name, a.type as account_type, a.icon as account_icon,
            NULL as linked_account_name,
            p.title as planification_title
           FROM transactions t
           LEFT JOIN categories c ON t.category_id = c.id
           LEFT JOIN accounts a ON t.account_id = a.id
           LEFT JOIN planifications p ON t.planification_id = p.id
           WHERE t.planification_id = ? AND t.deleted_at IS NULL
           ORDER BY t.created_at DESC`,
          [planificationId]
        );
        setLinkedTransactions(txResult);
      }
    } catch (err) {
      console.error('Error fetching planification detail:', err);
    } finally {
      setIsFetching(false);
    }
  }, [db, planificationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addItem = useCallback(
    async (amount: number, type: TransactionType, categoryId: string | null, note: string | null) => {
      if (!planificationId) return { success: false };

      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO planification_items (id, planification_id, amount, type, category_id, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, planificationId, amount, type, categoryId, note, now]
        );

        await db.runAsync(
          'UPDATE planifications SET updated_at = ? WHERE id = ?',
          [now, planificationId]
        );

        fetchData();
        return { success: true };
      } catch (err) {
        console.error('Error adding item:', err);
        return { success: false };
      } finally {
        setIsLoading(false);
      }
    },
    [db, planificationId, fetchData]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!planificationId) return false;

      try {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        await db.runAsync('DELETE FROM planification_items WHERE id = ?', [itemId]);

        const now = new Date().toISOString();
        await db.runAsync(
          'UPDATE planifications SET updated_at = ? WHERE id = ?',
          [now, planificationId]
        );

        fetchData();
        return true;
      } catch (err) {
        console.error('Error removing item:', err);
        fetchData();
        return false;
      }
    },
    [db, planificationId, fetchData]
  );

  const updateTitle = useCallback(
    async (title: string) => {
      if (!planificationId) return false;

      try {
        const now = new Date().toISOString();
        await db.runAsync(
          'UPDATE planifications SET title = ?, updated_at = ? WHERE id = ?',
          [title, now, planificationId]
        );
        fetchData();
        return true;
      } catch (err) {
        console.error('Error updating title:', err);
        return false;
      }
    },
    [db, planificationId, fetchData]
  );

  const deleteLinkedTransaction = useCallback(
    async (transactionId: string): Promise<'deleted_planification' | true | false> => {
      if (!planificationId) return false;
      try {
        const now = new Date().toISOString();
        setLinkedTransactions((prev) => prev.filter((t) => t.id !== transactionId));
        await db.runAsync(
          'UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?',
          [now, now, transactionId]
        );

        // Auto-delete planification if no linked transactions remain
        const remaining = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM transactions WHERE planification_id = ? AND deleted_at IS NULL',
          [planificationId]
        );
        if (remaining && remaining.count === 0) {
          await db.runAsync(
            'UPDATE planifications SET deleted_at = ?, updated_at = ? WHERE id = ?',
            [now, now, planificationId]
          );
          return 'deleted_planification';
        }

        fetchData();
        return true;
      } catch (err) {
        console.error('Error deleting linked transaction:', err);
        fetchData();
        return false;
      }
    },
    [db, planificationId, fetchData]
  );

  const total = items.reduce((sum, item) => {
    return item.type === 'income' ? sum - item.amount : sum + item.amount;
  }, 0);

  return {
    planification,
    items,
    linkedTransactions,
    total,
    addItem,
    removeItem,
    deleteLinkedTransaction,
    updateTitle,
    refresh: fetchData,
    isLoading,
    isFetching,
  };
}
