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
    async (params: { name: string; icon: string; color: string }) => {
      if (!canCreateCategory) {
        return { success: false, id: null, limitReached: true };
      }

      try {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
          `INSERT INTO categories (id, name, icon, color, is_default, category_type, created_at, sync_status)
           VALUES (?, ?, ?, ?, 0, 'expense', ?, 'pending')`,
          [id, params.name, params.icon, params.color, now]
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

  return {
    categories,
    expenseCategories,
    customCategories,
    transferCategory,
    incomeCategory,
    isLoading,
    refresh: loadCategories,
    createCategory,
    deleteCategory,
    customCategoriesCount,
    canCreateCategory,
    maxCustomCategories: MAX_CUSTOM_CATEGORIES,
  };
}
