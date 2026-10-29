/**
 * Enregistrement des opérations validées en transactions normales.
 * transaction_date = vraie date de l'opération (comptabilité), created_at =
 * maintenant (engagement). Pas de contrôle de solde : la banque a déjà
 * exécuté l'opération, la refuser fausserait le compte.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import { SYSTEM_CATEGORY_INCOME_ID, SYSTEM_CATEGORY_TRANSFER_ID } from '@/lib/database/schema';
import { useDataRefreshStore } from '@/stores/dataRefreshStore';
import { canonicalRef } from '../dedupe';
import type { ImportDraft } from './review';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Midi local du jour : l'ISO ne bascule pas sur la veille/le lendemain en UTC. */
export function draftDateToIso(ymd: string): string {
  return new Date(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10), 12).toISOString();
}

const INSERT_SQL = `INSERT INTO transactions
  (id, type, amount, category_id, account_id, transfer_id, note, created_at, transaction_date, updated_at, sync_status, external_ref)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`;

/**
 * Filet de sécurité : une opération dont la référence bancaire est déjà sur
 * une transaction active n'est JAMAIS réinsérée, même avec `forceDuplicate`.
 * Une référence déjà enregistrée dans ce lot n'est ignorée que sans
 * `forceDuplicate` (doublon du lot coché exprès).
 * Retourne le nombre d'opérations réellement enregistrées ; `onInserted`
 * reçoit chacune d'elles une fois la transaction validée (quota de lectures).
 */
export async function saveImportedOperations<D extends ImportDraft>(
  db: SQLiteDatabase, drafts: D[], onInserted?: (inserted: D[]) => void | Promise<void>
): Promise<number> {
  const now = new Date().toISOString();
  let saved = 0;
  const inserted: D[] = [];
  await db.withExclusiveTransactionAsync(async (txn) => {
    const rows = await txn.getAllAsync<{ external_ref: string }>(
      'SELECT external_ref FROM transactions WHERE deleted_at IS NULL AND external_ref IS NOT NULL'
    );
    const stored = new Set(rows.map((r) => canonicalRef(r.external_ref)));
    const inBatch = new Set<string>();
    for (const d of drafts) {
      const ref = d.externalRef ? canonicalRef(d.externalRef) : null;
      if (ref && stored.has(ref)) continue;
      if (ref && inBatch.has(ref) && !d.forceDuplicate) continue;
      if (ref) inBatch.add(ref);
      saved++;
      inserted.push(d);
      const txDate = draftDateToIso(d.date);
      const note = d.note.trim() || null;
      if (d.kind === 'transfer') {
        const transferId = generateId();
        const [from, to] = d.direction === 'debit'
          ? [d.accountId, d.counterAccountId]
          : [d.counterAccountId, d.accountId];
        await txn.runAsync(INSERT_SQL, [
          generateId(), 'expense', d.amount, SYSTEM_CATEGORY_TRANSFER_ID, from, transferId,
          note, now, txDate, now, d.externalRef,
        ]);
        await txn.runAsync(INSERT_SQL, [
          generateId(), 'income', d.amount, SYSTEM_CATEGORY_TRANSFER_ID, to, transferId,
          note, now, txDate, now, d.externalRef,
        ]);
      } else {
        const categoryId = d.kind === 'income' ? SYSTEM_CATEGORY_INCOME_ID : d.categoryId;
        await txn.runAsync(INSERT_SQL, [
          generateId(), d.kind, d.amount, categoryId, d.accountId, null,
          note, now, txDate, now, d.externalRef,
        ]);
      }
    }
  });
  await onInserted?.(inserted);
  useDataRefreshStore.getState().bumpAll();
  return saved;
}
