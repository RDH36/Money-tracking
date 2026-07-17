/**
 * Import : sélection du fichier `.mitsitsy` → validation → déchiffrement →
 * restauration de la base.
 *
 * Codes d'erreur (message de l'Error, mappés vers i18n dans l'UI) :
 *   INVALID_FILE       — pas un fichier .mitsitsy / enveloppe illisible
 *   UNSUPPORTED_VERSION — format plus récent que celui géré par cette app
 *   NEWER_BACKUP       — sauvegarde issue d'une version d'app plus récente
 *   WRONG_PASSWORD     — mot de passe manquant/incorrect ou fichier corrompu
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import type { SQLiteDatabase } from 'expo-sqlite';
import { BACKUP_FILE_VERSION, BACKUP_FORMAT } from './constants';
import { decryptPayload } from './crypto';
import { restoreDatabase } from './deserialize';
import type { BackupEnvelope } from './exportBackup';
import type { BackupData } from './serialize';

export interface PickedBackup {
  canceled: boolean;
  envelope?: BackupEnvelope;
  /** true si le fichier nécessite un mot de passe utilisateur. */
  protected?: boolean;
}

async function getDbVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

function validateEnvelope(envelope: BackupEnvelope, currentDbVersion: number): void {
  if (!envelope || envelope.format !== BACKUP_FORMAT) {
    throw new Error('INVALID_FILE');
  }
  if (typeof envelope.fileVersion !== 'number' || envelope.fileVersion > BACKUP_FILE_VERSION) {
    throw new Error('UNSUPPORTED_VERSION');
  }
  if (typeof envelope.dbVersion === 'number' && envelope.dbVersion > currentDbVersion) {
    throw new Error('NEWER_BACKUP');
  }
  if (typeof envelope.payload !== 'string' || typeof envelope.salt !== 'string') {
    throw new Error('INVALID_FILE');
  }
}

/** Ouvre le sélecteur de fichiers et valide l'enveloppe (sans déchiffrer). */
export async function pickBackupFile(db: SQLiteDatabase): Promise<PickedBackup> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return { canceled: true };
  }

  const asset = result.assets[0];

  // On ne se fie pas uniquement à l'extension (Android peut renommer le
  // fichier à l'enregistrement) : la vraie garantie est le champ `format` de
  // l'enveloppe, vérifié par validateEnvelope ci-dessous.
  let envelope: BackupEnvelope;
  try {
    const raw = await FileSystem.readAsStringAsync(asset.uri);
    envelope = JSON.parse(raw);
  } catch {
    throw new Error('INVALID_FILE');
  }

  validateEnvelope(envelope, await getDbVersion(db));
  return { canceled: false, envelope, protected: !!envelope.protected };
}

/**
 * Déchiffre l'enveloppe et remplace la base. `password` requis uniquement si
 * `envelope.protected` est vrai.
 */
export async function importBackup(
  db: SQLiteDatabase,
  envelope: BackupEnvelope,
  password?: string
): Promise<void> {
  const plaintext = decryptPayload(
    { salt: envelope.salt, iv: envelope.iv, ciphertext: envelope.payload },
    envelope.protected ? password : undefined
  );

  let data: BackupData;
  try {
    data = JSON.parse(plaintext);
  } catch {
    // Déchiffrement réussi mais contenu illisible → traité comme corruption.
    throw new Error('WRONG_PASSWORD');
  }

  await restoreDatabase(db, data);
}
