import type { SQLiteDatabase } from 'expo-sqlite';
import { INITIAL_SCHEMA, PRAGMAS } from './schema';

const DATABASE_VERSION = 2;

interface VersionResult {
  user_version: number;
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(PRAGMAS);

  const result = await db.getFirstAsync<VersionResult>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
    currentVersion = 1;
  }

  if (currentVersion < 2) {
    await migrateToV2(db);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(INITIAL_SCHEMA);
}

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  // Update category icons from emojis to Ionicons names
  const iconMapping: Record<string, string> = {
    '🍕': 'fast-food',
    '🚗': 'car',
    '🛍️': 'bag',
    '📄': 'document-text',
    '💊': 'medical',
    '🎬': 'game-controller',
    '📚': 'school',
    '📦': 'cube',
  };

  for (const [emoji, ionicon] of Object.entries(iconMapping)) {
    await db.runAsync(
      'UPDATE categories SET icon = ? WHERE icon = ?',
      [ionicon, emoji]
    );
  }
}
