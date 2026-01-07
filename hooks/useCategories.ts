import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSQLiteContext } from '@/lib/database';
import { SYSTEM_CATEGORY_TRANSFER_ID, SYSTEM_CATEGORY_INCOME_ID } from '@/lib/database/schema';
import type { Category } from '@/types';

export { SYSTEM_CATEGORY_TRANSFER_ID, SYSTEM_CATEGORY_INCOME_ID };

export function useCategories() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Category>(
        'SELECT * FROM categories ORDER BY name ASC'
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

  return {
    categories,
    expenseCategories,
    transferCategory,
    incomeCategory,
    isLoading,
    refresh: loadCategories,
  };
}
