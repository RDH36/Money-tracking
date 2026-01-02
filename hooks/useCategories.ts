import { useEffect, useState, useCallback } from 'react';
import { useSQLiteContext } from '@/lib/database';
import type { Category } from '@/types';

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

  return {
    categories,
    isLoading,
    refresh: loadCategories,
  };
}
