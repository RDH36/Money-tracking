/**
 * Modification d'une transaction existante (montant, date de l'opération,
 * catégorie, compte, note). `created_at` n'est jamais touché : la
 * gamification et l'engagement restent sur la date de saisie, et aucune XP
 * n'est rejouée. Les soldes sont calculés à la volée depuis les transactions
 * (`hooks/useAccounts.ts`) : il suffit de mettre les lignes à jour.
 * Un transfert (deux jambes liées par transfer_id) est modifié d'un bloc.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';

export interface TransactionEdit {
  /** Centimes, > 0. */
  amount: number;
  /** ISO de la date de l'opération (transaction_date). */
  transactionDate: string;
  note: string | null;
  /** Dépense seulement ; ignoré pour un revenu ou un transfert. */
  categoryId: string | null;
  /** Compte de la ligne ; pour un transfert, compte débité (jambe dépense). */
  accountId: string;
  /** Transfert seulement : compte crédité (jambe revenu). */
  toAccountId?: string | null;
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

interface Leg {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  account_id: string;
}

const sign = (type: Leg['type']) => (type === 'income' ? 1 : -1);

async function balanceOf(db: SQLiteDatabase, accountId: string): Promise<number> {
  const row = await db.getFirstAsync<{ balance: number }>(
    `SELECT a.initial_balance
       + COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS balance
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
     WHERE a.id = ? GROUP BY a.id`,
    [accountId]
  );
  return row?.balance ?? 0;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  tx: { id: string; transfer_id: string | null },
  edit: TransactionEdit
): Promise<UpdateResult> {
  if (edit.amount <= 0) return { ok: false, error: 'errors.validationFailed' };
  const legs = tx.transfer_id
    ? await db.getAllAsync<Leg>(
        'SELECT id, type, amount, account_id FROM transactions WHERE transfer_id = ? AND deleted_at IS NULL',
        [tx.transfer_id]
      )
    : await db.getAllAsync<Leg>(
        'SELECT id, type, amount, account_id FROM transactions WHERE id = ? AND deleted_at IS NULL',
        [tx.id]
      );
  if (legs.length === 0) return { ok: false, error: 'errors.saveFailed' };

  const isTransfer = !!tx.transfer_id;
  if (isTransfer && (!edit.toAccountId || edit.toAccountId === edit.accountId)) {
    return { ok: false, error: 'errors.saveFailed' };
  }
  const newAccount = (leg: Leg) =>
    isTransfer && leg.type === 'income' ? (edit.toAccountId as string) : edit.accountId;

  // Effet de la modification sur chaque compte touché.
  const delta = new Map<string, number>();
  const add = (acc: string, v: number) => delta.set(acc, (delta.get(acc) ?? 0) + v);
  for (const leg of legs) {
    add(leg.account_id, -sign(leg.type) * leg.amount);
    add(newAccount(leg), sign(leg.type) * edit.amount);
  }
  // Même règle qu'à la saisie : un compte ne passe pas sous zéro à cause de la
  // modification (une modification qui ne le baisse pas reste toujours permise).
  for (const [accountId, d] of delta) {
    if (d >= 0) continue;
    if ((await balanceOf(db, accountId)) + d < 0) return { ok: false, error: 'errors.insufficientBalance' };
  }

  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const leg of legs) {
      const categorySql = !isTransfer && leg.type === 'expense' ? ', category_id = ?' : '';
      const params = [edit.amount, edit.transactionDate, edit.note, newAccount(leg), now];
      if (categorySql) params.push(edit.categoryId as string);
      await txn.runAsync(
        `UPDATE transactions SET amount = ?, transaction_date = ?, note = ?, account_id = ?, updated_at = ?,
           sync_status = 'pending'${categorySql}
         WHERE id = ?`,
        [...params, leg.id]
      );
    }
  });
  useDataRefreshStore.getState().bumpAll();
  return { ok: true };
}
