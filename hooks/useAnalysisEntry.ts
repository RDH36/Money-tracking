import { useState, useEffect } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from '@/lib/database';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCycleSettingsValue } from '@/hooks/useCycleSettings';
import { pickCycleToAnalyze } from '@/hooks/useAnalysisCycle';
import { DAY_MS, EMPTY_CYCLE_TX, assess, fetchDataStat } from '@/lib/analysis/sufficiency';
import { fetchCurrentTotals } from '@/lib/analysis/queries';
import { formatCycleRange } from '@/lib/analysis/cycle';
import { getVerdict, type VerdictStatus } from '@/lib/analysis/verdict';
import { scheduleAnalysisReadyReminder } from '@/lib/notifications';
import type { CycleSettings, Indicators } from '@/lib/analysis/types';

/** Verdict allégé pour la carte d'entrée : statut, gardé, taux, libellé du cycle. */
export interface EntryVerdict {
  status: VerdictStatus;
  /** `revenus − dépenses`, en centimes. */
  kept: number;
  /** Taux gardé, ou `null` si revenu inconnu. */
  rate: number | null;
  /** « juillet 2026 » / « 28 juil. → 27 août ». */
  range: string;
  incomeEstimated: boolean;
}

/**
 * Verdict à bas coût : même cycle que l'écran (`pickCycleToAnalyze`), une
 * seule requête de totaux — jamais `getIndicators`. Le revenu attendu est
 * injecté comme dans `getIndicators` quand le cycle n'a aucun revenu.
 */
async function computeEntryVerdict(
  db: SQLiteDatabase,
  settings: CycleSettings,
  expectedIncome: number | null,
  lang: string
): Promise<EntryVerdict | null> {
  const { cycle, txCount } = await pickCycleToAnalyze(db, settings);
  if (txCount < EMPTY_CYCLE_TX) return null;
  const day7Iso = new Date(new Date(cycle.start).getTime() + 7 * DAY_MS).toISOString();
  const totals = await fetchCurrentTotals(db, cycle, day7Iso);
  const expected = expectedIncome ?? 0;
  const incomeEstimated = totals.income <= 0 && expected > 0;
  const income = incomeEstimated ? expected : totals.income;
  // `getVerdict` ne lit que ces quatre champs : un stub typé évite de
  // dupliquer ses seuils ici.
  const stub = {
    income,
    keptAmount: income - totals.expenses,
    incomeEstimated,
    bestCycle: null,
  } satisfies Pick<Indicators, 'income' | 'keptAmount' | 'incomeEstimated' | 'bestCycle'>;
  const v = getVerdict(stub as Indicators);
  return { status: v.status, kept: v.kept, rate: v.rate, range: formatCycleRange(cycle, lang), incomeEstimated };
}

/**
 * Faut-il afficher la carte d'entrée sous le hero, et que dit-elle ? Visible
 * dès que les données suffisent — un point d'entrée qui apparaît et disparaît
 * n'est pas trouvable. `verdict` est `null` sans cycle exploitable ; la carte
 * retombe alors sur son rendu générique.
 * Profite du passage pour (re)programmer le rappel de fin de cycle — au jour
 * de paye en mode `payday`, au 1er du mois sinon.
 */
export function useAnalysisEntry(): { visible: boolean; verdict: EntryVerdict | null } {
  const db = useSQLiteContext();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [visible, setVisible] = useState(false);
  const [verdict, setVerdict] = useState<EntryVerdict | null>(null);
  const transactionsVersion = useDataRefreshStore((s) => s.transactionsVersion);
  const settings = useCycleSettingsValue();
  const expectedIncome = useSettingsStore((s) => s.expectedIncome);
  const payDay = settings.mode === 'payday' ? settings.payDay : null;

  useEffect(() => {
    let alive = true;
    (async () => {
      const stat = await fetchDataStat(db);
      const { enough } = assess(stat);
      if (!alive) return;
      setVisible(enough);
      if (!enough) {
        setVerdict(null);
        return;
      }
      scheduleAnalysisReadyReminder(payDay).catch(() => {});
      const v = await computeEntryVerdict(db, settings, expectedIncome, lang).catch(() => null);
      if (alive) setVerdict(v);
    })();
    return () => {
      alive = false;
    };
  }, [db, transactionsVersion, payDay, settings, expectedIncome, lang]);

  return { visible, verdict };
}
