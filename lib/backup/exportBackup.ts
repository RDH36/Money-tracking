/**
 * Export : sérialise la base → chiffre → écrit le fichier `.mitsitsy`
 * DIRECTEMENT sur le téléphone (téléchargement), sans ouvrir de feuille de
 * partage.
 *
 * Android : Storage Access Framework — l'utilisateur choisit un dossier
 *   (ex. « Téléchargements ») la première fois ; le choix est mémorisé
 *   (setting `backup_dir_uri`) pour que les exports suivants soient silencieux.
 * iOS : pas de dossier « Téléchargements » public → repli sur le partage natif
 *   (seul moyen de sortir un fichier de l'app sur iOS).
 */
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import type { SQLiteDatabase } from 'expo-sqlite';
import {
  BACKUP_EXTENSION,
  BACKUP_FILE_VERSION,
  BACKUP_FORMAT,
  BACKUP_MIME,
} from './constants';
import { encryptPayload } from './crypto';
import { serializeDatabase } from './serialize';

/** Structure du fichier `.mitsitsy` (enveloppe non chiffrée + payload chiffré). */
export interface BackupEnvelope {
  format: string;
  fileVersion: number;
  dbVersion: number;
  appVersion: string;
  createdAt: string;
  protected: boolean;
  salt: string;
  iv: string;
  payload: string;
}

export type SaveMethod = 'download' | 'share';

export interface ExportResult {
  location: string;
  filename: string;
  method: SaveMethod;
}

const SAF = FileSystem.StorageAccessFramework;
const DIR_URI_KEY = 'backup_dir_uri';

async function getDbVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
    [key, value, now, value, now]
  );
}

function buildFilename(date: Date): string {
  const stamp = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `mitsitsy-backup-${stamp}${BACKUP_EXTENSION}`;
}

/** Écrit le fichier directement dans un dossier choisi (Android SAF). */
async function downloadAndroid(
  db: SQLiteDatabase,
  filename: string,
  content: string
): Promise<ExportResult> {
  let dirUri = await getSetting(db, DIR_URI_KEY);
  let fileUri: string | null = null;

  // Tente d'écrire dans le dossier déjà autorisé.
  if (dirUri) {
    try {
      fileUri = await SAF.createFileAsync(dirUri, filename, BACKUP_MIME);
    } catch {
      dirUri = null; // permission révoquée / dossier supprimé
    }
  }

  // Sinon, demande à l'utilisateur de choisir un dossier (une seule fois).
  if (!fileUri) {
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm.granted) throw new Error('SAVE_CANCELLED');
    dirUri = perm.directoryUri;
    await setSetting(db, DIR_URI_KEY, dirUri);
    fileUri = await SAF.createFileAsync(dirUri, filename, BACKUP_MIME);
  }

  await FileSystem.writeAsStringAsync(fileUri, content);
  return { location: fileUri, filename, method: 'download' };
}

/** iOS : écrit en cache puis ouvre le partage (pas de dossier public). */
async function shareIOS(filename: string, content: string): Promise<ExportResult> {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const uri = `${dir}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: BACKUP_MIME, dialogTitle: 'Mitsitsy', UTI: 'public.data' });
  }
  return { location: uri, filename, method: 'share' };
}

/**
 * Génère une sauvegarde et l'enregistre directement sur le téléphone.
 * `password` optionnel : protège le fichier par mot de passe.
 * Lève `SAVE_CANCELLED` si l'utilisateur annule le choix du dossier (Android).
 */
export async function exportBackup(db: SQLiteDatabase, password?: string): Promise<ExportResult> {
  const data = await serializeDatabase(db);
  const encrypted = encryptPayload(JSON.stringify(data), password);

  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    fileVersion: BACKUP_FILE_VERSION,
    dbVersion: await getDbVersion(db),
    appVersion: Constants.expoConfig?.version ?? '',
    createdAt: new Date().toISOString(),
    protected: encrypted.protected,
    salt: encrypted.salt,
    iv: encrypted.iv,
    payload: encrypted.ciphertext,
  };

  const filename = buildFilename(new Date());
  const content = JSON.stringify(envelope);

  return Platform.OS === 'android'
    ? downloadAndroid(db, filename, content)
    : shareIOS(filename, content);
}
