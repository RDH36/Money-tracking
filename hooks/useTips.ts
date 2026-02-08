import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from '@/lib/database';
import { useTipsEnabled } from '@/stores/settingsStore';

export type TipCategory = 'dashboard' | 'add' | 'planification';

const TIPS_PER_CATEGORY: Record<TipCategory, string[]> = {
  dashboard: [
    'tips.dashboard.tapBalance',
    'tips.dashboard.pullToRefresh',
    'tips.dashboard.addAccount',
  ],
  add: [
    'tips.add.transferMoney',
    'tips.add.addNote',
    'tips.add.quickCategory',
  ],
  planification: [
    'tips.planification.intro',
    'tips.planification.deadline',
    'tips.planification.validate',
  ],
};

interface UseTipsReturn {
  currentTip: string | null;
  showTip: boolean;
}

export function useTips(category: TipCategory): UseTipsReturn {
  const db = useSQLiteContext();
  const tipsEnabled = useTipsEnabled();
  const [currentTip, setCurrentTip] = useState<string | null>(null);

  const storageKey = `tips_index_${category}`;
  const tips = TIPS_PER_CATEGORY[category];

  useFocusEffect(
    useCallback(() => {
      if (!tipsEnabled) {
        setCurrentTip(null);
        return;
      }

      const loadAndRotateTip = async () => {
        try {
          const result = await db.getFirstAsync<{ value: string }>(
            'SELECT value FROM settings WHERE key = ?',
            [storageKey]
          );
          const lastIndex = result?.value ? parseInt(result.value, 10) : -1;
          const nextIndex = (lastIndex + 1) % tips.length;

          setCurrentTip(tips[nextIndex]);

          const now = new Date().toISOString();
          await db.runAsync(
            `INSERT INTO settings (key, value, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
            [storageKey, String(nextIndex), now, String(nextIndex), now]
          );
        } catch (error) {
          console.error('Error loading tip index:', error);
          setCurrentTip(tips[0]);
        }
      };

      loadAndRotateTip();
    }, [tipsEnabled, storageKey, tips, db])
  );

  return {
    currentTip,
    showTip: tipsEnabled && currentTip !== null,
  };
}
