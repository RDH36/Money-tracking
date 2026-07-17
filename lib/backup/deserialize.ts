/**
 * Restauration : réécrit les données sérialisées dans la base SQLite.
 *
 * Stratégie « remplacement » : toutes les tables (sauf `settings`) sont vidées
 * puis réinsérées depuis la sauvegarde, le tout dans une seule transaction
 * (rollback automatique en cas d'erreur). Les colonnes insérées sont calculées
 * dynamiquement (intersection clés-de-ligne ∩ colonnes-réelles) pour tolérer
 * les différences de version de schéma entre l'appareil source et cible.
 *
 * On utilise `withExclusiveTransactionAsync` (connexion dédiée) et NON
 * `withTransactionAsync` : sur une app déjà remplie, d'autres hooks écrivent en
 * parallèle sur la connexion principale, ce qui faisait échouer le `BEGIN`
 * partagé avec « cannot start a transaction within a transaction ».
 */
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';
import {
  BACKUP_TABLES,
  BACKUP_WIPE_TABLES,
  EXCLUDED_SETTING_KEYS,
} from './constants';
import type { BackupData } from './serialize';

async function getTableColumns(db: SQLiteDatabase, table: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((r) => r.name));
}

function buildInsert(table: string, columns: string[]): string {
  const placeholders = columns.map(() => '?').join(', ');
  return `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
}

async function insertRows(
  db: SQLiteDatabase,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const validColumns = await getTableColumns(db, table);
  const isSettings = table === 'settings';

  for (const row of rows) {
    // Réglages liés au verrouillage : jamais importés (PIN device-local).
    if (isSettings && EXCLUDED_SETTING_KEYS.includes(String(row.key))) continue;

    const columns = Object.keys(row).filter((k) => validColumns.has(k));
    if (columns.length === 0) continue;

    const values = columns.map((c) => row[c] as SQLiteBindValue);
    await db.runAsync(buildInsert(table, columns), values);
  }
}

/**
 * Remplace le contenu de la base par `data`. Ne touche pas expo-secure-store
 * (PIN/biométrie restent ceux de l'appareil).
 */
export async function restoreDatabase(db: SQLiteDatabase, data: BackupData): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    // Attendre (jusqu'à 8 s) plutôt qu'échouer si la connexion principale
    // détient un verrou d'écriture au moment de l'import.
    await txn.execAsync('PRAGMA busy_timeout = 8000');

    // 1. Vider les tables (enfants avant parents). `settings` est préservée.
    for (const table of BACKUP_WIPE_TABLES) {
      await txn.runAsync(`DELETE FROM ${table}`);
    }

    // 2. Réinsérer (parents avant enfants). `settings` = upsert clé par clé.
    for (const table of BACKUP_TABLES) {
      await insertRows(txn, table, data[table]);
    }
  });
}
