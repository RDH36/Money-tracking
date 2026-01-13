import type { SQLiteDatabase } from 'expo-sqlite';
import {
  INITIAL_SCHEMA,
  PRAGMAS,
  CREATE_PLANIFICATIONS_TABLE,
  CREATE_PLANIFICATION_ITEMS_TABLE,
  ADD_DEADLINE_COLUMN,
  CREATE_ACCOUNTS_TABLE,
  ADD_ACCOUNT_ID_TO_TRANSACTIONS,
  ADD_TRANSFER_ID_TO_TRANSACTIONS,
  CREATE_ACCOUNTS_INDEX,
  ADD_CATEGORY_TYPE_TO_CATEGORIES,
  ADD_IS_DEFAULT_TO_ACCOUNTS,
  SYSTEM_CATEGORY_TRANSFER_ID,
  SYSTEM_CATEGORY_INCOME_ID,
} from './schema';

const DATABASE_VERSION = 8;

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

  if (currentVersion < 4) {
    await migrateToV4(db);
    currentVersion = 4;
  }

  if (currentVersion < 5) {
    await migrateToV5(db);
    currentVersion = 5;
  }

  if (currentVersion < 6) {
    await migrateToV6(db);
    currentVersion = 6;
  }

  if (currentVersion < 7) {
    await migrateToV7(db);
    currentVersion = 7;
  }

  if (currentVersion < 8) {
    await migrateToV8(db);
    currentVersion = 8;
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

async function migrateToV4(db: SQLiteDatabase): Promise<void> {
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(planifications)"
  );
  const hasDeadline = tableInfo.some((col) => col.name === 'deadline');
  if (!hasDeadline) {
    await db.execAsync(ADD_DEADLINE_COLUMN);
  }
}

async function migrateToV5(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_ACCOUNTS_TABLE);

  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(transactions)"
  );
  const hasAccountId = tableInfo.some((col) => col.name === 'account_id');
  const hasTransferId = tableInfo.some((col) => col.name === 'transfer_id');

  if (!hasAccountId) {
    await db.execAsync(ADD_ACCOUNT_ID_TO_TRANSACTIONS);
  }
  if (!hasTransferId) {
    await db.execAsync(ADD_TRANSFER_ID_TO_TRANSACTIONS);
  }

  await db.execAsync(CREATE_ACCOUNTS_INDEX);
}

async function migrateToV6(db: SQLiteDatabase): Promise<void> {
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(categories)"
  );
  const hasCategoryType = tableInfo.some((col) => col.name === 'category_type');

  if (!hasCategoryType) {
    await db.execAsync(ADD_CATEGORY_TYPE_TO_CATEGORIES);
  }

  const now = new Date().toISOString();

  // Create system category for transfers
  const transferExists = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM categories WHERE id = ?',
    [SYSTEM_CATEGORY_TRANSFER_ID]
  );
  if (!transferExists) {
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, is_default, category_type, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [SYSTEM_CATEGORY_TRANSFER_ID, 'Transfert', 'swap-horizontal', '#6366F1', 1, 'transfer', now, 'synced']
    );
  }

  // Create system category for income
  const incomeExists = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM categories WHERE id = ?',
    [SYSTEM_CATEGORY_INCOME_ID]
  );
  if (!incomeExists) {
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, color, is_default, category_type, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [SYSTEM_CATEGORY_INCOME_ID, 'Revenu', 'trending-up', '#22C55E', 1, 'income', now, 'synced']
    );
  }
}

async function migrateToV7(db: SQLiteDatabase): Promise<void> {
  const now = new Date().toISOString();

  // Set default reminder frequency to '1h' if not already set
  const reminderExists = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['reminder_frequency']
  );
  if (!reminderExists) {
    await db.runAsync(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
      ['reminder_frequency', '1h', now]
    );
  }
}

async function migrateToV8(db: SQLiteDatabase): Promise<void> {
  // Add is_default column to accounts table
  const tableInfo = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(accounts)"
  );
  const hasIsDefault = tableInfo.some((col) => col.name === 'is_default');

  if (!hasIsDefault) {
    await db.execAsync(ADD_IS_DEFAULT_TO_ACCOUNTS);
  }

  // Mark the first 2 accounts (by creation date) as default
  // These are the accounts created during onboarding (Banque and Espèce)
  await db.runAsync(
    `UPDATE accounts SET is_default = 1
     WHERE id IN (
       SELECT id FROM accounts
       WHERE deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 2
     )`
  );
}
