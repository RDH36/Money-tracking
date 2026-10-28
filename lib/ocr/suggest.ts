/** Catégorie proposée pour une dépense importée (pur). */
import type { ParsedOperation } from './types';
import { labelOverlap } from './text';

export interface CategoryHistoryEntry {
  note: string;
  categoryId: string;
}

/**
 * 1. Historique : une dépense passée au libellé proche garde sa catégorie
 *    (après un premier import corrigé, les suivants se rangent seuls).
 * 2. Mots-clés du parseur (`categoryHint`), si la catégorie existe encore.
 */
export function suggestCategory(
  op: ParsedOperation,
  history: CategoryHistoryEntry[],
  validCategoryIds: Set<string>
): string | null {
  if (op.kind !== 'expense') return null;
  const subject = op.merchant ?? op.note;
  for (const entry of history) {
    if (validCategoryIds.has(entry.categoryId) && labelOverlap(subject, entry.note) >= 0.6) {
      return entry.categoryId;
    }
  }
  return op.categoryHint && validCategoryIds.has(op.categoryHint) ? op.categoryHint : null;
}
