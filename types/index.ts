export type TransactionType = 'expense' | 'income';
export type SyncStatus = 'pending' | 'synced';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  deleted_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: number;
  created_at: string;
  sync_status: SyncStatus;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface SyncMeta {
  id: number;
  last_sync_at: string | null;
  user_id: string | null;
}

export interface TransactionInsert
  extends Omit<Transaction, 'sync_status' | 'deleted_at'> {
  sync_status?: SyncStatus;
  deleted_at?: string | null;
}

export interface CategoryInsert
  extends Omit<Category, 'is_default' | 'sync_status'> {
  is_default?: number;
  sync_status?: SyncStatus;
}
