export type TransactionType = 'expense' | 'income';
export type SyncStatus = 'pending' | 'synced';
export type AccountType = 'bank' | 'cash';
export type CategoryType = 'expense' | 'income' | 'transfer' | 'system';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number;
  icon: string;
  is_default: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AccountWithBalance extends Account {
  current_balance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  account_id: string | null;
  transfer_id: string | null;
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
  category_type: CategoryType;
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

export interface SimulatedExpense {
  id: string;
  amount: number;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  note: string | null;
}

export type PlanificationStatus = 'pending' | 'completed';

export interface Planification {
  id: string;
  title: string;
  status: PlanificationStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PlanificationItem {
  id: string;
  planification_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  note: string | null;
  created_at: string;
}

export interface PlanificationItemWithCategory extends PlanificationItem {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export interface PlanificationWithTotal extends Planification {
  total: number;
  total_expenses: number;
  total_income: number;
  item_count: number;
}
