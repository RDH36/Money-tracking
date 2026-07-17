import { useCallback, useState } from 'react';
import { useSQLiteContext } from '@/lib/database';
import {
  exportBackup,
  pickBackupFile,
  importBackup,
  type BackupEnvelope,
  type PickedBackup,
  type SaveMethod,
} from '@/lib/backup';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGamificationStore, type GamificationData } from '@/stores/gamificationStore';
import { useUnlocksStore } from '@/stores/unlocksStore';
import { useQuestsStore } from '@/stores/questsStore';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

/**
 * Recharge les stores Zustand depuis la base fraîchement restaurée, pour que
 * l'UI (thème, devise, gamification…) reflète immédiatement les données
 * importées sans redémarrage. Les réglages de verrouillage restent ceux de
 * l'appareil (non importés).
 */
async function rehydrateStores(db: SQLiteDatabase): Promise<void> {
  const settings = useSettingsStore.getState();
  const get = async (key: string) =>
    (await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]))
      ?.value;

  const [balance, theme, reminder, currency, colorMode, tips] = await Promise.all([
    get('balance_hidden'),
    get('theme_id'),
    get('reminder_frequency'),
    get('currency'),
    get('color_mode'),
    get('tips_enabled'),
  ]);
  settings.initialize(
    balance === '1',
    theme || settings.themeId,
    (reminder as any) || settings.reminderFrequency,
    currency || DEFAULT_CURRENCY,
    (colorMode as any) || settings.colorMode,
    tips !== '0',
    settings.appLockEnabled, // conservé (device-local)
    settings.appLockBiometric
  );

  const gRows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM gamification'
  );
  const g: Record<string, string> = {};
  gRows.forEach((r) => { g[r.key] = r.value; });
  const badgeRows = await db.getAllAsync<{ badge_type: string }>('SELECT badge_type FROM badges');
  const gData: GamificationData = {
    currentStreak: parseInt(g.current_streak || '0', 10),
    longestStreak: parseInt(g.longest_streak || '0', 10),
    lastActivityDate: g.last_activity_date || '',
    totalXP: parseInt(g.total_xp || '0', 10),
    streakFreezeAvailable: parseInt(g.streak_freeze_available || '1', 10),
    streakFreezeUsedDate: g.streak_freeze_used_date || '',
    dailyChallengeDate: g.daily_challenge_date || '',
    dailyChallengeType: g.daily_challenge_type || '',
    dailyChallengeCompleted: g.daily_challenge_completed === '1',
    weeklyChallengeStart: g.weekly_challenge_start || '',
    weeklyChallengeType: g.weekly_challenge_type || '',
    weeklyChallengeCompleted: g.weekly_challenge_completed === '1',
    monthlyChallengeMonth: g.monthly_challenge_month || '',
    monthlyChallengeType: g.monthly_challenge_type || '',
    monthlyChallengeCompleted: g.monthly_challenge_completed === '1',
    badges: badgeRows.map((b) => b.badge_type),
  };
  useGamificationStore.getState().initialize(gData);

  const unlockRows = await db.getAllAsync<{ key: string }>('SELECT key FROM unlocks');
  useUnlocksStore.getState().initialize(unlockRows.map((r) => r.key));

  const questRows = await db.getAllAsync<{ id: string; current_step: number; completed_at: string | null }>(
    'SELECT id, current_step, completed_at FROM quests'
  );
  useQuestsStore.getState().initialize(
    questRows.map((q) => ({
      id: q.id,
      currentStep: q.current_step ?? 0,
      completedAt: q.completed_at ?? null,
      metricValue: 0,
    }))
  );
}

export function useBackup() {
  const db = useSQLiteContext();
  const bumpAll = useDataRefreshStore((s) => s.bumpAll);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doExport = useCallback(
    async (password?: string): Promise<SaveMethod | null> => {
      setError(null);
      setExporting(true);
      try {
        const result = await exportBackup(db, password);
        return result.method;
      } catch (e) {
        // L'utilisateur a annulé le choix du dossier : pas une erreur.
        if (e instanceof Error && e.message === 'SAVE_CANCELLED') return null;
        console.error('Backup export failed:', e);
        setError('EXPORT_FAILED');
        return null;
      } finally {
        setExporting(false);
      }
    },
    [db]
  );

  const pickFile = useCallback(async (): Promise<PickedBackup | null> => {
    setError(null);
    try {
      return await pickBackupFile(db);
    } catch (e) {
      console.error('Backup pick failed:', e);
      setError(e instanceof Error ? e.message : 'INVALID_FILE');
      return null;
    }
  }, [db]);

  const doImport = useCallback(
    async (envelope: BackupEnvelope, password?: string): Promise<boolean> => {
      setError(null);
      setImporting(true);
      try {
        await importBackup(db, envelope, password);
        await rehydrateStores(db);
        bumpAll();
        return true;
      } catch (e) {
        console.error('Backup import failed:', e);
        setError(e instanceof Error ? e.message : 'IMPORT_FAILED');
        return false;
      } finally {
        setImporting(false);
      }
    },
    [db, bumpAll]
  );

  return { exporting, importing, error, setError, doExport, pickFile, doImport };
}
