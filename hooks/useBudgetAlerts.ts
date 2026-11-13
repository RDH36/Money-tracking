import { useCallback } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from '@/lib/database';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  BUDGET_ALERT_KEYS,
  parseBudgetAlerts,
  type BudgetAlerts,
  type BudgetAlertId,
} from '@/lib/budget/alerts';

/**
 * Lit les 3 clés en une requête. Utilisé par les DEUX points d'hydratation
 * (ThemeContext + useSettings) et la restauration de sauvegarde.
 */
export async function loadBudgetAlerts(db: SQLiteDatabase): Promise<BudgetAlerts> {
  const keys = Object.values(BUDGET_ALERT_KEYS);
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${keys.map(() => '?').join(', ')})`,
    keys
  );
  const raw: Record<string, string> = {};
  for (const r of rows) raw[r.key] = r.value;
  return parseBudgetAlerts(raw);
}

/** Interrupteurs d'alerte budget (lecture réactive) + écriture persistée. */
export function useBudgetAlerts() {
  const db = useSQLiteContext();
  const alert50 = useSettingsStore((s) => s.alert50);
  const alert80 = useSettingsStore((s) => s.alert80);
  const alert100 = useSettingsStore((s) => s.alert100);
  const setStore = useSettingsStore((s) => s.setBudgetAlert);

  const setAlert = useCallback(
    async (id: BudgetAlertId, on: boolean) => {
      const prev = useSettingsStore.getState()[id];
      setStore(id, on);
      try {
        const now = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
          [BUDGET_ALERT_KEYS[id], on ? '1' : '0', now, on ? '1' : '0', now]
        );
      } catch (error) {
        console.error('Error saving budget alert setting:', error);
        setStore(id, prev);
      }
    },
    [db, setStore]
  );

  return { alerts: { alert50, alert80, alert100 } as BudgetAlerts, setAlert };
}

/** Lecture seule pour les écrans d'affichage (pas besoin de la base). */
export function useBudgetAlertFlags(): BudgetAlerts {
  const alert50 = useSettingsStore((s) => s.alert50);
  const alert80 = useSettingsStore((s) => s.alert80);
  const alert100 = useSettingsStore((s) => s.alert100);
  return { alert50, alert80, alert100 };
}
