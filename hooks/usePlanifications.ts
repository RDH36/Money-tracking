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
} from '@/types';

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
         COALESCE(SUM(pi.amount), 0) as total,
         COUNT(pi.id) as item_count
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

        await fetchPlanifications();
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
        await db.runAsync(
          'UPDATE planifications SET deleted_at = ?, updated_at = ? WHERE id = ?',
          [now, now, id]
        );
        await cancelPlanificationReminders(id);
        await fetchPlanifications();
        return true;
      } catch (err) {
        console.error('Error deleting planification:', err);
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
        await fetchPlanifications();
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
    async (id: string, accountId: string) => {
      setIsLoading(true);
      try {
        const items = await db.getAllAsync<PlanificationItemWithCategory>(
          `SELECT pi.*, c.name as category_name, c.icon as category_icon, c.color as category_color
           FROM planification_items pi
           LEFT JOIN categories c ON pi.category_id = c.id
           WHERE pi.planification_id = ?`,
          [id]
        );

        const now = new Date().toISOString();

        for (const item of items) {
          const transactionId = generateId();
          await db.runAsync(
            `INSERT INTO transactions (id, type, amount, category_id, account_id, note, created_at, updated_at, sync_status)
             VALUES (?, 'expense', ?, ?, ?, ?, ?, ?, 'pending')`,
            [transactionId, item.amount, item.category_id, accountId, item.note, now, now]
          );
        }

        await db.runAsync(
          `UPDATE planifications SET status = 'completed', updated_at = ? WHERE id = ?`,
          [now, id]
        );

        await cancelPlanificationReminders(id);
        await fetchPlanifications();
        return true;
      } catch (err) {
        console.error('Error validating planification:', err);
        return false;
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
  const [planification, setPlanification] = useState<PlanificationWithTotal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchData = useCallback(async () => {
    if (!planificationId) return;

    try {
      setIsFetching(true);

      const planifResult = await db.getFirstAsync<PlanificationWithTotal>(
        `SELECT p.*,
         COALESCE(SUM(pi.amount), 0) as total,
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
    async (amount: number, categoryId: string | null, note: string | null) => {
      if (!planificationId) return { success: false };

      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO planification_items (id, planification_id, amount, category_id, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, planificationId, amount, categoryId, note, now]
        );

        await db.runAsync(
          'UPDATE planifications SET updated_at = ? WHERE id = ?',
          [now, planificationId]
        );

        await fetchData();
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
        await db.runAsync('DELETE FROM planification_items WHERE id = ?', [itemId]);

        const now = new Date().toISOString();
        await db.runAsync(
          'UPDATE planifications SET updated_at = ? WHERE id = ?',
          [now, planificationId]
        );

        await fetchData();
        return true;
      } catch (err) {
        console.error('Error removing item:', err);
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
        await fetchData();
        return true;
      } catch (err) {
        console.error('Error updating title:', err);
        return false;
      }
    },
    [db, planificationId, fetchData]
  );

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    planification,
    items,
    total,
    addItem,
    removeItem,
    updateTitle,
    refresh: fetchData,
    isLoading,
    isFetching,
  };
}
