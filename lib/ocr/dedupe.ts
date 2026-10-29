/**
 * Anti-doublon de l'import : d'abord la référence bancaire, sinon montant +
 * date (± 1 jour) + libellé proche. Entre deux sources différentes (ticket ↔
 * ligne MCB, ticket de caisse ↔ ticket carte), montant + sens + date ± 1 jour. Contrôle le lot importé (captures qui se
 * chevauchent) et les transactions déjà en base.
 */
import type { ParsedOperation } from './types';
import { daysBetween, labelOverlap } from './text';

/** Transaction existante, réduite à ce qui sert à la comparaison. */
export interface ExistingTransaction {
  id: string;
  type: 'expense' | 'income';
  /** Centimes, positif. */
  amount: number;
  /** `YYYY-MM-DD` (date locale de transaction_date). */
  date: string;
  note: string | null;
  externalRef: string | null;
  isTransfer: boolean;
  /** Catégorie affichée quand la note est vide (« Ressemble à : … »). */
  categoryId?: string | null;
}

/** reference : même réf. bancaire en base ; similar : saisie proche en base ; batch : déjà dans le lot. */
export type DuplicateReason = 'reference' | 'similar' | 'batch';

export interface DedupedOperation {
  op: ParsedOperation;
  duplicate: DuplicateReason | null;
  /** Id de la transaction en base trouvée (`reference` / `similar`), sinon null. */
  matchId: string | null;
  /** Cette transaction, pour la montrer sous le libellé. */
  match: ExistingTransaction | null;
}

/** Valeur stockée dans transactions.external_ref, ex. `mcb:FT26301QW7K2`. */
export function externalRefOf(op: ParsedOperation): string | null {
  return op.reference ? `${op.source}:${op.reference}` : null;
}

/** Forme canonique pour comparer deux références lues par l'OCR (O/0, I/1…). */
export function canonicalRef(ref: string): string {
  return ref
    .toUpperCase()
    .replace(/[^A-Z0-9:]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/S/g, '5')
    .replace(/Z/g, '2')
    .replace(/B/g, '8');
}

function sameRef(a: string | null, b: string | null): boolean {
  return !!a && !!b && canonicalRef(a) === canonicalRef(b);
}

/** Source d'une référence stockée (`mcb:FT…` → `mcb`), null sans préfixe. */
function refSource(externalRef: string): string | null {
  const i = externalRef.indexOf(':');
  return i > 0 ? externalRef.slice(0, i) : null;
}

/** Même sens d'argent : dépense ↔ dépense, retrait ↔ retrait. */
function sameDirection(op: ParsedOperation, tx: ExistingTransaction): boolean {
  if (op.kind === 'transfer') return tx.isTransfer && tx.type === (op.amount < 0 ? 'expense' : 'income');
  return !tx.isTransfer && tx.type === op.kind;
}

function looksLikeSameBatchOp(a: ParsedOperation, b: ParsedOperation): boolean {
  if (a.source !== b.source) {
    // Deux pièces du même achat (ticket de caisse + ticket carte, ticket + relevé).
    return a.amount === b.amount && a.kind === b.kind && daysBetween(a.date, b.date) <= 1;
  }
  return (
    a.amount === b.amount &&
    a.date === b.date &&
    (!a.reference || !b.reference) &&
    labelOverlap(a.label, b.label) >= 0.8
  );
}

function matchesExisting(op: ParsedOperation, tx: ExistingTransaction): boolean {
  if (Math.abs(op.amount) !== tx.amount || daysBetween(op.date, tx.date) > 1) return false;
  if (tx.externalRef) {
    // Déjà importée d'une autre source (ligne MCB face au ticket) : même
    // montant, même sens, ± 1 jour suffisent. Même source : autre référence.
    // Ticket de caisse : sa réf. dépend du nom d'émetteur lu, deux photos du
    // même ticket peuvent différer ; il se compare donc aussi à lui-même.
    const from = refSource(tx.externalRef);
    const comparable = from !== null && (from !== op.source || op.source === 'receipt');
    return comparable && sameDirection(op, tx);
  }
  if (!sameDirection(op, tx)) return false;
  if (op.kind === 'transfer') return true;
  const note = tx.note?.trim() ?? '';
  return note === '' || labelOverlap(`${op.note} ${op.label}`, note) >= 0.5;
}

export function dedupeOperations(
  ops: ParsedOperation[],
  existing: ExistingTransaction[]
): { items: DedupedOperation[]; merged: number } {
  const items: DedupedOperation[] = [];
  const usedExisting = new Set<string>();
  let merged = 0;

  for (const op of ops) {
    const ref = externalRefOf(op);
    // Même référence déjà dans le lot (captures qui se chevauchent) : fusion.
    if (ref && items.some((i) => sameRef(externalRefOf(i.op), ref))) {
      merged++;
      continue;
    }

    let duplicate: DuplicateReason | null = null;
    let match: ExistingTransaction | null = null;
    const byRef = ref ? existing.find((tx) => sameRef(tx.externalRef, ref)) : undefined;
    if (byRef) {
      duplicate = 'reference';
      match = byRef;
    } else {
      const similar = existing.find((tx) => !usedExisting.has(tx.id) && matchesExisting(op, tx));
      if (similar) {
        duplicate = 'similar';
        match = similar;
        usedExisting.add(similar.id);
      } else if (items.some((i) => looksLikeSameBatchOp(i.op, op))) {
        duplicate = 'batch';
      }
    }
    items.push({ op, duplicate, matchId: match?.id ?? null, match });
  }
  return { items, merged };
}
