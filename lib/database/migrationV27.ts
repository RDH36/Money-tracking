import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * V27 — rappel « le soir » par défaut pour les NOUVELLES installations
 * seulement. `startVersion` = user_version lu avant toute migration :
 * 0 = base neuve. Une base existante (≥ 1), y compris une sauvegarde
 * .mitsitsy restaurée, garde ses réglages : aucune écriture.
 */
export async function migrateToV27(db: SQLiteDatabase, startVersion: number): Promise<void> {
  if (startVersion !== 0) return;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    ['reminder_frequency', 'evening', now]
  );
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    ['reminder_origin', 'new_install', now]
  );
}
