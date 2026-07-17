/**
 * Sérialisation : lit toutes les tables SQLite vers un objet JS.
 *
 * On exporte TOUTES les lignes, y compris celles soft-deletées (`deleted_at`),
 * pour produire un clone fidèle de la base sur le nouveau téléphone.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { BACKUP_TABLES } from './constants';

/** Données brutes de la base, indexées par nom de table. */
export type BackupData = Record<string, Record<string, unknown>[]>;

export async function serializeDatabase(db: SQLiteDatabase): Promise<BackupData> {
  const data: BackupData = {};
  for (const table of BACKUP_TABLES) {
    // Noms de tables issus d'une liste constante interne (pas d'entrée user).
    data[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }
  return data;
}
