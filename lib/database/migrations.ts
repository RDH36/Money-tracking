import type { SQLiteDatabase } from 'expo-sqlite';
import {
  INITIAL_SCHEMA,
  PRAGMAS,
  CREATE_PLANIFICATIONS_TABLE,
  CREATE_PLANIFICATION_ITEMS_TABLE,
} from './schema';

const DATABASE_VERSION = 3;

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

  if (currentVersion < 3) {
    await migrateToV3(db);
    currentVersion = 3;
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

async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_PLANIFICATIONS_TABLE);
  await db.execAsync(CREATE_PLANIFICATION_ITEMS_TABLE);
}
