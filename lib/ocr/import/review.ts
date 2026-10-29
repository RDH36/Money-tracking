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
  /**
   * Doublon probable ou du lot coché exprès : enregistré quand même. Ne lève
   * jamais le blocage d'une référence déjà sur une transaction active.
   */
  forceDuplicate?: boolean;
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
    // Ticket payé en espèces : la dépense sort du compte espèces.
    accountId: op.payment === 'cash' && op.kind === 'expense' ? ctx.cashId ?? ctx.bankId : ctx.bankId,
    counterAccountId: op.kind === 'transfer' ? ctx.cashId : null,
    externalRef: externalRefOf(op),
  }));
}

/** « Déjà enregistrée » (même référence qu'une transaction active) : non cochable. */
export function isLocked(i: ReviewItem): boolean {
  return i.duplicate === 'reference';
}

/** Coche/décoche une ligne ; sans effet sur une ligne bloquée. */
export function toggleItem(i: ReviewItem): ReviewItem {
  return isLocked(i) ? i : { ...i, selected: !i.selected };
}

/**
 * Modification depuis la fiche. Montant corrigé : le badge « Déjà saisie ? » ou
 * « En double » tombe ; une ligne bloquée (référence connue) le reste, comme à
 * l'enregistrement (décision de Raymond).
 */
export function applyPatch(i: ReviewItem, patch: Partial<ReviewItem>): ReviewItem {
  const amountChanged = patch.amount !== undefined && patch.amount !== i.amount;
  const unflagged = amountChanged && !isLocked(i) && i.duplicate !== null;
  const duplicate = unflagged ? null : i.duplicate;
  // Badge tombé (montant différent) : la ligne se coche, ce n'est plus la même opération.
  const selected = duplicate === 'reference' ? false : patch.selected ?? (unflagged ? true : i.selected);
  return { ...i, ...patch, duplicate, selected };
}

/** Nombre d'opérations réellement enregistrées (titre de l'en-tête). */
export function countToSave(items: ReviewItem[]): number {
  return draftsToSave(items).length;
}

/** Brouillons envoyés à l'enregistrement : seuls les doublons non bloqués sont forcés. */
export function draftsToSave(items: ReviewItem[]): ReviewItem[] {
  return items
    .filter((i) => i.selected && !isLocked(i) && isDraftValid(i))
    .map((i) => ({ ...i, forceDuplicate: i.duplicate !== null }));
}

/** Dépense d'un ticket payé en espèces : hors du choix du « Compte bancaire ». */
export function isPaidCash(i: ReviewItem): boolean {
  return i.op.payment === 'cash' && i.kind === 'expense';
}

/** Une opération cochée est enregistrable si ses comptes sont cohérents. */
export function isDraftValid(d: ImportDraft): boolean {
  if (d.amount <= 0 || !d.accountId) return false;
  if (d.kind === 'transfer') return !!d.counterAccountId && d.counterAccountId !== d.accountId;
  return true;
}
