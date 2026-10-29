/** Lectures SQLite nécessaires à l'écran de vérification de l'import. */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { AccountType } from '@/types';
import { externalRefOf, type ExistingTransaction } from '../dedupe';
import type { CategoryHistoryEntry } from '../suggest';
import type { ParsedOperation } from '../types';
import { toYmd } from '../text';

interface TxRow {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  note: string | null;
  transaction_date: string | null;
  created_at: string;
  external_ref: string | null;
  transfer_id: string | null;
  category_id: string | null;
}

const TX_COLUMNS =
  'id, type, amount, note, transaction_date, created_at, external_ref, transfer_id, category_id';

function shiftDay(ymd: string, days: number): string {
  const d = new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10) + days);
  return toYmd(d);
}

/**
 * Transactions comparables aux opérations importées : celles de la même
 * période (± 2 jours, fuseau compris) et celles portant une des références.
 */
export async function loadExistingForDedupe(
  db: SQLiteDatabase,
  ops: ParsedOperation[]
): Promise<ExistingTransaction[]> {
  if (ops.length === 0) return [];
  const dates = ops.map((o) => o.date).sort();
  const rows = await db.getAllAsync<TxRow>(
    `SELECT ${TX_COLUMNS} FROM transactions
     WHERE deleted_at IS NULL
       AND COALESCE(transaction_date, created_at) >= ?
       AND COALESCE(transaction_date, created_at) < ?`,
    [shiftDay(dates[0], -2), shiftDay(dates[dates.length - 1], 3)]
  );
  const refs = ops.map(externalRefOf).filter((r): r is string => !!r);
  if (refs.length > 0) {
    const byRef = await db.getAllAsync<TxRow>(
      `SELECT ${TX_COLUMNS} FROM transactions
       WHERE deleted_at IS NULL AND external_ref IN (${refs.map(() => '?').join(', ')})`,
      refs
    );
    const known = new Set(rows.map((r) => r.id));
    rows.push(...byRef.filter((r) => !known.has(r.id)));
  }
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    date: toYmd(new Date(r.transaction_date ?? r.created_at)),
    note: r.note,
    externalRef: r.external_ref,
    isTransfer: !!r.transfer_id,
    categoryId: r.category_id,
  }));
}

/** Dernières dépenses notées et catégorisées (catégories encore actives). */
export async function loadCategoryHistory(db: SQLiteDatabase): Promise<CategoryHistoryEntry[]> {
  const rows = await db.getAllAsync<{ note: string; category_id: string }>(
    `SELECT t.note, t.category_id FROM transactions t
     JOIN categories c ON c.id = t.category_id AND c.deleted_at IS NULL
     WHERE t.deleted_at IS NULL AND t.type = 'expense' AND t.transfer_id IS NULL
       AND t.note IS NOT NULL AND t.note != ''
     ORDER BY t.created_at DESC LIMIT 300`
  );
  return rows.map((r) => ({ note: r.note, categoryId: r.category_id }));
}

export async function loadExpenseCategoryIds(db: SQLiteDatabase): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM categories
     WHERE deleted_at IS NULL AND (category_type = 'expense' OR category_type IS NULL)`
  );
  return new Set(rows.map((r) => r.id));
}

export interface ImportAccounts {
  /** Compte bancaire proposé : celui du dernier import de la source, sinon le compte banque par défaut. */
  bankId: string | null;
  /** Compte espèces, contrepartie des retraits au distributeur. */
  cashId: string | null;
}

export async function loadImportAccounts(db: SQLiteDatabase, source: string): Promise<ImportAccounts> {
  const accounts = await db.getAllAsync<{ id: string; type: AccountType }>(
    `SELECT id, type FROM accounts WHERE deleted_at IS NULL
     ORDER BY is_default DESC, created_at ASC`
  );
  const last = await db.getFirstAsync<{ account_id: string }>(
    `SELECT account_id FROM transactions
     WHERE deleted_at IS NULL AND transfer_id IS NULL AND account_id IS NOT NULL
       AND external_ref LIKE ?
     ORDER BY created_at DESC LIMIT 1`,
    [`${source}:%`]
  );
  const bankId =
    accounts.find((a) => a.id === last?.account_id)?.id ??
    accounts.find((a) => a.type === 'bank')?.id ??
    accounts[0]?.id ??
    null;
  const cashId = accounts.find((a) => a.type === 'cash' && a.id !== bankId)?.id ?? null;
  return { bankId, cashId };
}
