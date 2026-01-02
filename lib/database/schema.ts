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

export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_sync_status ON categories(sync_status);
`;

export const INITIAL_SCHEMA = `
${PRAGMAS}
${CREATE_CATEGORIES_TABLE}
${CREATE_TRANSACTIONS_TABLE}
${CREATE_SETTINGS_TABLE}
${CREATE_SYNC_META_TABLE}
${CREATE_INDEXES}
`;
