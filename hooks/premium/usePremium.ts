import { useCallback, useEffect } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { usePostHog } from 'posthog-react-native';
import { useSQLiteContext } from '@/lib/database';
import { LICENSE_PUBLIC_KEY } from '@/constants/app';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { usePremiumStore } from '@/stores/premiumStore';
import {
  extractToken, hasEntitlement, licenseChannel, localDayIndex, verifyLicense,
  type License, type LicenseCheck,
} from '@/lib/premium';

export const LICENSE_KEY = 'plus_license';
/** Plus grand jour vu sur ce téléphone : reculer l'horloge ne rallonge pas un pass. */
const CLOCK_KEY = 'plus_clock_max';

async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [
    key, value, new Date().toISOString(),
  ]);
}

/** Jour max vu (mis à jour si aujourd'hui est plus loin). */
async function touchClock(db: SQLiteDatabase): Promise<number> {
  const today = localDayIndex(new Date());
  const stored = parseInt((await getSetting(db, CLOCK_KEY)) ?? '', 10);
  if (Number.isFinite(stored) && stored >= today) return stored;
  await setSetting(db, CLOCK_KEY, String(today));
  return today;
}

async function loadPremium(db: SQLiteDatabase): Promise<void> {
  try {
    const token = await getSetting(db, LICENSE_KEY);
    if (!token) {
      usePremiumStore.getState().setCheck(null);
      return;
    }
    const maxSeenDay = await touchClock(db);
    usePremiumStore.getState().setCheck(verifyLicense(token, { publicKey: LICENSE_PUBLIC_KEY, maxSeenDay }));
  } catch (err) {
    console.error('Reading Plus license failed:', err);
    usePremiumStore.getState().setCheck(null);
  }
}

/** Fin la plus lointaine (null = à vie). */
function lastsLonger(a: License, b: License): boolean {
  if (a.expiresOn === null) return true;
  if (b.expiresOn === null) return false;
  return a.expiresOn >= b.expiresOn;
}

/**
 * Licence Plus du téléphone, vérifiée hors ligne à chaque chargement (et après
 * une restauration de sauvegarde : le jeton voyage dans le .mitsitsy).
 */
export function usePremium() {
  const db = useSQLiteContext();
  const posthog = usePostHog();
  const version = useDataRefreshStore((s) => s.accountsVersion);
  const loaded = usePremiumStore((s) => s.loaded);
  const check = usePremiumStore((s) => s.check);

  useEffect(() => {
    loadPremium(db);
  }, [db, version]);

  const license = check?.ok ? check.license : null;

  /** Jeton long collé ou reçu par lien : vérifié hors ligne puis stocké. */
  const redeem = useCallback(async (input: string, via: 'paste' | 'link'): Promise<LicenseCheck> => {
    const maxSeenDay = await touchClock(db);
    const result = verifyLicense(input, { publicKey: LICENSE_PUBLIC_KEY, maxSeenDay });
    if (!result.ok) {
      posthog.capture('plus_code_failed', { reason: result.reason, via });
      return result;
    }
    const current = usePremiumStore.getState().check;
    // Un pass plus court ne remplace jamais un pass actif plus long.
    if (current?.ok && !lastsLonger(result.license, current.license)) return current;
    await setSetting(db, LICENSE_KEY, extractToken(input));
    usePremiumStore.getState().setCheck(result);
    posthog.capture('plus_code_redeemed', { plan: result.license.plan, channel: licenseChannel(result.license), via });
    return result;
  }, [db, posthog]);

  return {
    loaded,
    license,
    /** Jeton stocké mais refusé (expiré, falsifié). */
    storedError: check && !check.ok ? check : null,
    ocrUnlimited: hasEntitlement(license, 'ocr_unlimited'),
    redeem,
  };
}
