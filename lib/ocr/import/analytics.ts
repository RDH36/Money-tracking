/** Propriétés des events PostHog de l'import (pur : tranches, jamais de montant ni de libellé). */
import type { ReviewItem } from './review';

/** Tranche d'un compte : 0, 1, 2-5, 6-10, 11+. */
export function countBucket(n: number): string {
  if (n <= 0) return '0';
  if (n === 1) return '1';
  if (n <= 5) return '2-5';
  if (n <= 10) return '6-10';
  return '11+';
}

const KINDS: Record<string, string> = {
  mcb: 'mcb', 'boa-gab': 'boa_gab', 'bmoi-tpe': 'bmoi_tpe', receipt: 'receipt', generic: 'generic',
  mvola: 'sms', 'orange-money': 'sms', 'airtel-money': 'sms', sms: 'sms',
};
/** Sources lues par le moteur générique (relevé à l'écran, SMS collé). */
const GENERIC_SOURCES = new Set(['generic', 'mvola', 'orange-money', 'airtel-money', 'sms']);

/** Source principale de la lecture (la première reconnue). */
export function readKind(sources: string[]): string {
  return (sources[0] && KINDS[sources[0]]) || 'unknown';
}

/** Opération modifiée par l'utilisateur avant l'enregistrement. */
export function isEdited(i: ReviewItem): boolean {
  return i.amount !== Math.abs(i.op.amount) || i.date !== i.op.date || i.kind !== i.op.kind || i.note !== i.op.note;
}

export function readCompletedProps(items: ReviewItem[], sources: string[]) {
  return {
    kind: readKind(sources),
    ops_bucket: countBucket(items.length),
    new_ops_bucket: countBucket(items.filter((i) => i.duplicate === null).length),
  };
}

/**
 * `import_generic_read` : source `screenshot` (galerie, partage), `photo`
 * (appareil photo) ou `sms`, et nombre d'opérations du moteur générique.
 * null si aucune opération ne vient du générique.
 */
export function genericReadProps(items: ReviewItem[], pickSource: string) {
  const ops = items.filter((i) => GENERIC_SOURCES.has(i.op.source)).length;
  if (ops === 0) return null;
  const source = pickSource === 'sms' ? 'sms' : pickSource === 'camera' ? 'photo' : 'screenshot';
  return { source, ops };
}

/** Champs corrigés à la vérification sur les opérations du générique (un event par champ). */
export function correctedFields(inserted: ReviewItem[]): string[] {
  const fields = new Set<string>();
  for (const i of inserted) {
    if (!GENERIC_SOURCES.has(i.op.source)) continue;
    if (i.amount !== Math.abs(i.op.amount)) fields.add('amount');
    if (i.date !== i.op.date) fields.add('date');
    if (i.kind !== i.op.kind) fields.add('kind');
    if (i.note !== i.op.note) fields.add('note');
  }
  return [...fields];
}

export function importSavedProps(inserted: ReviewItem[]) {
  return {
    ops_bucket: countBucket(inserted.length),
    edited_bucket: countBucket(inserted.filter(isEdited).length),
    duplicates_bucket: countBucket(inserted.filter((i) => i.forceDuplicate).length),
  };
}
