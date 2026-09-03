import { useCallback, useMemo } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useSQLiteContext } from '@/lib/database';
import {
  useSettingsStore,
  parseCycleInit,
  type CycleInit,
  type CycleRawRows,
  type ExpectedIncomeSource,
} from '@/stores/settingsStore';
import type { CycleMode, CycleSettings } from '@/lib/analysis/types';

/** Les 5 clés `settings` du cycle personnel (Phase 7). */
export const CYCLE_SETTING_KEYS = [
  'cycle_mode',
  'cycle_pay_day',
  'expected_income',
  'expected_income_source',
  'cycle_confirmed_at',
] as const;

/**
 * Lit les 5 clés en une requête et les parse. Utilisé par les DEUX points
 * d'hydratation (ThemeContext + useSettings) — ne jamais dupliquer la lecture.
 */
export async function loadCycleSettings(db: SQLiteDatabase): Promise<CycleInit> {
  const placeholders = CYCLE_SETTING_KEYS.map(() => '?').join(', ');
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    [...CYCLE_SETTING_KEYS]
  );
  const raw: CycleRawRows = {};
  for (const row of rows) raw[row.key as keyof CycleRawRows] = row.value;
  return parseCycleInit(raw);
}

export interface SaveCycleParams {
  mode: CycleMode;
  /** Jour de paye 1–31 ; ignoré (→ null) si le mode n'est pas `payday`. */
  payDay?: number | null;
  /** Revenu attendu en centimes ; `undefined` conserve la valeur courante. */
  expectedIncome?: number | null;
  source?: ExpectedIncomeSource;
}

export interface UseCycleSettingsResult {
  /** Dérivé du store : mode + jour de paye effectif. */
  settings: CycleSettings;
  expectedIncome: number | null;
  expectedIncomeSource: ExpectedIncomeSource | null;
  /** Vrai dès que l'utilisateur a répondu une fois (carte de confirmation). */
  isConfirmed: boolean;
  /** Écrit en base, met le store à jour et pose `cycle_confirmed_at = now`. */
  save: (p: SaveCycleParams) => Promise<void>;
}

/**
 * Sélecteur mémoïsé : `cycleSettings` du store est un getter qui crée un
 * nouvel objet à chaque lecture, inutilisable tel quel comme sélecteur.
 */
export function useCycleSettingsValue(): CycleSettings {
  const mode = useSettingsStore((s) => s.cycleMode);
  const payDay = useSettingsStore((s) => s.cyclePayDay);
  return useMemo(
    () => ({ mode, payDay: mode === 'payday' ? payDay : null }),
    [mode, payDay]
  );
}

export function useCycleSettings(): UseCycleSettingsResult {
  const db = useSQLiteContext();
  const settings = useCycleSettingsValue();
  const expectedIncome = useSettingsStore((s) => s.expectedIncome);
  const expectedIncomeSource = useSettingsStore((s) => s.expectedIncomeSource);
  const cycleConfirmedAt = useSettingsStore((s) => s.cycleConfirmedAt);

  const save = useCallback(
    async (p: SaveCycleParams) => {
      const store = useSettingsStore.getState();
      const now = new Date().toISOString();
      const payDay = p.mode === 'payday' && p.payDay != null ? Math.trunc(p.payDay) : null;
      const income = p.expectedIncome === undefined ? store.expectedIncome : p.expectedIncome;
      const source = p.source ?? (income === null ? null : store.expectedIncomeSource);

      const values: Record<(typeof CYCLE_SETTING_KEYS)[number], string> = {
        cycle_mode: p.mode,
        cycle_pay_day: payDay === null ? '' : String(payDay),
        expected_income: income === null ? '' : String(Math.trunc(income)),
        expected_income_source: source ?? '',
        cycle_confirmed_at: now,
      };

      // Pas de withTransactionAsync : sur la connexion principale, d'autres hooks
      // écrivent en parallèle et le BEGIN partagé échoue (« cannot start a
      // transaction within a transaction », voir lib/backup/deserialize.ts).
      // Cinq upserts idempotents suffisent.
      for (const key of CYCLE_SETTING_KEYS) {
        await db.runAsync(
          `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
          [key, values[key], now]
        );
      }

      store.setCycleMode(p.mode);
      store.setCyclePayDay(payDay);
      store.setExpectedIncome(income);
      store.setExpectedIncomeSource(source);
      store.setCycleConfirmedAt(now);
    },
    [db]
  );

  return {
    settings,
    expectedIncome,
    expectedIncomeSource,
    isConfirmed: !!cycleConfirmedAt,
    save,
  };
}
