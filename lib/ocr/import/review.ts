/** Brouillons de l'écran de vérification (pur : aucune dépendance native). */
import { externalRefOf, type DedupedOperation, type DuplicateReason } from '../dedupe';
import { suggestCategory, type CategoryHistoryEntry } from '../suggest';
import type { OperationKind, ParsedOperation } from '../types';

export type Direction = 'debit' | 'credit';

const FALLBACK_CATEGORY_ID = 'other';

/** Ce qui sera enregistré pour une opération (modifiable par l'utilisateur). */
export interface ImportDraft {
  kind: OperationKind;
  /** Centimes, positif. */
  amount: number;
  /** debit : l'argent sort du compte ; credit : il y entre. */
  direction: Direction;
  /** `YYYY-MM-DD`. */
  date: string;
  note: string;
  categoryId: string | null;
  accountId: string | null;
  /** Contrepartie d'un transfert (espèces pour un retrait au distributeur). */
  counterAccountId: string | null;
  externalRef: string | null;
}

export interface ReviewItem extends ImportDraft {
  key: string;
  op: ParsedOperation;
  duplicate: DuplicateReason | null;
  selected: boolean;
}

export interface ReviewContext {
  history: CategoryHistoryEntry[];
  validCategoryIds: Set<string>;
  bankId: string | null;
  cashId: string | null;
}

export function buildReviewItems(items: DedupedOperation[], ctx: ReviewContext): ReviewItem[] {
  return items.map(({ op, duplicate }, index) => ({
    key: `${index}-${op.reference ?? op.date}`,
    op,
    duplicate,
    // Doublon signalé : décoché par défaut, l'utilisateur peut le cocher.
    selected: duplicate === null,
    kind: op.kind,
    amount: Math.abs(op.amount),
    direction: op.amount < 0 ? 'debit' : 'credit',
    date: op.date,
    note: op.note,
    categoryId: suggestCategory(op, ctx.history, ctx.validCategoryIds)
      // Sans suggestion : « Autre », le bac où l'appli range déjà les dépenses sans catégorie.
      ?? (op.kind === 'expense' && ctx.validCategoryIds.has(FALLBACK_CATEGORY_ID) ? FALLBACK_CATEGORY_ID : null),
    accountId: ctx.bankId,
    counterAccountId: op.kind === 'transfer' ? ctx.cashId : null,
    externalRef: externalRefOf(op),
  }));
}

/** Une opération cochée est enregistrable si ses comptes sont cohérents. */
export function isDraftValid(d: ImportDraft): boolean {
  if (d.amount <= 0 || !d.accountId) return false;
  if (d.kind === 'transfer') return !!d.counterAccountId && d.counterAccountId !== d.accountId;
  return true;
}
