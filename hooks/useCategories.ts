import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { SYSTEM_CATEGORY_TRANSFER_ID, SYSTEM_CATEGORY_INCOME_ID, MAX_CUSTOM_CATEGORIES } from '@/lib/database/schema';
import type { Category } from '@/types';

export { SYSTEM_CATEGORY_TRANSFER_ID, SYSTEM_CATEGORY_INCOME_ID, MAX_CUSTOM_CATEGORIES };

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useCategories() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Category>(
        'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC'
      );
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filter categories by type for different use cases
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.category_type === 'expense' || !c.category_type),
    [categories]
  );

  const transferCategory = useMemo(
    () => categories.find((c) => c.id === SYSTEM_CATEGORY_TRANSFER_ID),
    [categories]
  );

  const incomeCategory = useMemo(
    () => categories.find((c) => c.id === SYSTEM_CATEGORY_INCOME_ID),
    [categories]
  );

  // Custom categories are those with is_default = 0 and category_type = 'expense'
  const customCategories = useMemo(
    () => categories.filter((c) => c.is_default === 0 && c.category_type === 'expense'),
    [categories]
  );

  const customCategoriesCount = customCategories.length;
  const canCreateCategory = customCategoriesCount < MAX_CUSTOM_CATEGORIES;

  const createCategory = useCallback(
    async (params: { name: string; icon: string; color: string; budget_limit?: number | null }) => {
      if (!canCreateCategory) {
        return { success: false, id: null, limitReached: true };
      }

      try {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, is_default, category_type, budget_limit, created_at, sync_status)
           VALUES (?, ?, ?, ?, 0, 'expense', ?, ?, 'pending')`,
          [id, params.name, params.icon, params.color, params.budget_limit ?? null, now]
        );

        await loadCategories();
        return { success: true, id, limitReached: false };
      } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, id: null, limitReached: false };
      }
    },
    [db, loadCategories, canCreateCategory]
  );

  const updateCategory = useCallback(
    async (id: string, params: { name?: string; icon?: string; color?: string; budget_limit?: number | null }) => {
      try {
        const fields: string[] = [];
        const values: (string | number | null)[] = [];

        if (params.name !== undefined) { fields.push('name = ?'); values.push(params.name); }
        if (params.icon !== undefined) { fields.push('icon = ?'); values.push(params.icon); }
        if (params.color !== undefined) { fields.push('color = ?'); values.push(params.color); }
        if (params.budget_limit !== undefined) { fields.push('budget_limit = ?'); values.push(params.budget_limit); }

        if (fields.length === 0) return true;

        values.push(id);
        await db.runAsync(
          `UPDATE categories SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
          values
        );

        await loadCategories();
        return true;
      } catch (error) {
        console.error('Error updating category:', error);
        return false;
      }
    },
    [db, loadCategories]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db.runAsync(
          'UPDATE categories SET deleted_at = ? WHERE id = ? AND is_default = 0',
          [now, id]
        );
        await loadCategories();
        return true;
      } catch (error) {
        console.error('Error deleting category:', error);
        return false;
      }
    },
    [db, loadCategories]
  );

  const deleteCategoryWithOptions = useCallback(
    async (id: string, action: 'move' | 'delete'): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        if (action === 'move') {
          const otherCategory = categories.find(
            (c) => c.name === 'Autre' || c.name === 'Other'
          );
          if (otherCategory) {
            await db.runAsync(
              'UPDATE transactions SET category_id = ? WHERE category_id = ? AND deleted_at IS NULL',
              [otherCategory.id, id]
            );
          }
        } else {
          await db.runAsync(
            'UPDATE transactions SET deleted_at = ? WHERE category_id = ? AND deleted_at IS NULL',
            [now, id]
          );
        }
        await db.runAsync(
          'UPDATE categories SET deleted_at = ? WHERE id = ? AND is_default = 0',
          [now, id]
        );
        await loadCategories();
        return true;
      } catch (error) {
        console.error('Error deleting category with options:', error);
        return false;
      }
    },
    [db, loadCategories, categories]
  );

  const getTransactionCount = useCallback(
    async (categoryId: string): Promise<number> => {
      try {
        const result = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND deleted_at IS NULL',
          [categoryId]
        );
        return result?.count ?? 0;
      } catch (error) {
        console.error('Error getting transaction count:', error);
        return 0;
      }
    },
    [db]
  );

  return {
    categories,
    expenseCategories,
    customCategories,
    transferCategory,
    incomeCategory,
    isLoading,
    refresh: loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteCategoryWithOptions,
    getTransactionCount,
    customCategoriesCount,
    canCreateCategory,
    maxCustomCategories: MAX_CUSTOM_CATEGORIES,
  };
}
