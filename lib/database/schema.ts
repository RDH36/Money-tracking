export const DATABASE_NAME = 'money-tracker.db';

export const PRAGMAS = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount INTEGER NOT NULL,
  category_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced')),
  deleted_at TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
`;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced'))
);
`;

export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const CREATE_SYNC_META_TABLE = `
CREATE TABLE IF NOT EXISTS sync_meta (
  id INTEGER PRIMARY KEY,
  last_sync_at TEXT,
  user_id TEXT
);
`;

export const CREATE_PLANIFICATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS planifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  deadline TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
`;

export const ADD_DEADLINE_COLUMN = `
ALTER TABLE planifications ADD COLUMN deadline TEXT;
`;

export const CREATE_PLANIFICATION_ITEMS_TABLE = `
CREATE TABLE IF NOT EXISTS planification_items (
  id TEXT PRIMARY KEY,
  planification_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (planification_id) REFERENCES planifications(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
`;

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON categories(sync_status);
`;

export const CREATE_ACCOUNTS_TABLE = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash')),
  initial_balance INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
`;

export const ADD_ACCOUNT_ID_TO_TRANSACTIONS = `
ALTER TABLE transactions ADD COLUMN account_id TEXT REFERENCES accounts(id);
`;

export const ADD_TRANSFER_ID_TO_TRANSACTIONS = `
ALTER TABLE transactions ADD COLUMN transfer_id TEXT;
`;

export const CREATE_ACCOUNTS_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
`;

export const ADD_CATEGORY_TYPE_TO_CATEGORIES = `
ALTER TABLE categories ADD COLUMN category_type TEXT DEFAULT 'expense' CHECK (category_type IN ('expense', 'income', 'transfer', 'system'));
`;

export const SYSTEM_CATEGORY_TRANSFER_ID = 'system-transfer';
export const SYSTEM_CATEGORY_INCOME_ID = 'system-income';

export const INITIAL_SCHEMA = `
${PRAGMAS}
${CREATE_CATEGORIES_TABLE}
${CREATE_TRANSACTIONS_TABLE}
${CREATE_SETTINGS_TABLE}
${CREATE_SYNC_META_TABLE}
${CREATE_INDEXES}
`;
