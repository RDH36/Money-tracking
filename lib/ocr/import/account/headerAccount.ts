/** Compte de l'en-tête de la vérification d'import (pur : aucune dépendance native). */
import type { ReviewItem } from '../review';

/** Dépense d'un ticket payé en espèces : elle sort du compte espèces, pas du compte bancaire. */
export function isPaidCash(i: ReviewItem): boolean {
  return i.op.payment === 'cash' && i.kind === 'expense';
}

/**
 * Import fait uniquement de tickets payés en espèces, et l'utilisateur a un
 * compte espèces (repéré par son type, `cashId`) : l'en-tête propose ce compte.
 * Sans compte espèces, rien ne change (l'en-tête reste le compte bancaire).
 */
export function isCashOnlyImport(items: ReviewItem[], cashId: string | null): boolean {
  return cashId !== null && items.length > 0 && items.every(isPaidCash);
}

/**
 * Lignes que le compte choisi en haut gouverne. Jamais une ligne dont
 * l'utilisateur a choisi le compte dans la fiche (`accountManual`). Sinon :
 * les opérations bancaires (les tickets payés en espèces d'un import mixte
 * gardent le compte espèces), tous les tickets d'un import fait uniquement de
 * tickets payés en espèces, et toute ligne encore sans compte.
 */
export function governedByHeader<T extends ReviewItem>(items: T[], cashId: string | null): T[] {
  const cashOnly = isCashOnlyImport(items, cashId);
  return items.filter((i) => !i.accountManual && (cashOnly || !i.accountId || !isPaidCash(i)));
}

/** Compte affiché en haut : celui de toutes les lignes gouvernées, sinon aucun. */
export function headerAccountId(items: ReviewItem[], cashId: string | null): string | null {
  const governed = governedByHeader(items, cashId);
  const first = governed[0]?.accountId ?? null;
  return first !== null && governed.every((i) => i.accountId === first) ? first : null;
}

/**
 * Compte choisi en haut, appliqué aux lignes gouvernées (voir `governedByHeader`).
 * Un retrait dont la contrepartie se confondait avec le compte choisi la perd ;
 * elle revient (compte espèces) dès que le choix ne s'y oppose plus.
 */
export function withAccountForAll<T extends ReviewItem>(items: T[], accountId: string, cashId: string | null): T[] {
  const governed = new Set(governedByHeader(items, cashId).map((i) => i.key));
  return items.map((i) => {
    if (!governed.has(i.key)) return i;
    const counter = i.kind === 'transfer' ? i.counterAccountId ?? cashId : i.counterAccountId;
    return { ...i, accountId, counterAccountId: counter === accountId ? null : counter };
  });
}
