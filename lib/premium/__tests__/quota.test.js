// Quota de lectures OCR : cycle, compteur, plan de lecture, lectures consommées.
const { test } = require('node:test');
const assert = require('node:assert');
const { join } = require('node:path');
const q = require(join(process.env.PREMIUM_OUT, 'index.js'));

test('quotaCycle sans jour de paye : 1er du mois, remise à zéro au mois suivant', () => {
  const a = q.quotaCycle(new Date(2026, 9, 29, 10));
  assert.strictEqual(a.key, 'ocr_reads_2026-10-01');
  assert.deepStrictEqual([a.resetsOn.getFullYear(), a.resetsOn.getMonth(), a.resetsOn.getDate()], [2026, 10, 1]);
  assert.strictEqual(q.quotaCycle(new Date(2026, 10, 1, 0, 0, 1)).key, 'ocr_reads_2026-11-01');
  assert.strictEqual(q.quotaCycle(new Date(2026, 9, 31, 23, 59)).key, 'ocr_reads_2026-10-01');
});

test('quotaCycle avec jour de paye : bascule le jour de paye', () => {
  const s = { mode: 'payday', payDay: 25 };
  assert.strictEqual(q.quotaCycle(new Date(2026, 9, 24, 12), s).key, 'ocr_reads_2026-09-25');
  assert.strictEqual(q.quotaCycle(new Date(2026, 9, 25, 0, 0, 1), s).key, 'ocr_reads_2026-10-25');
  const c = q.quotaCycle(new Date(2026, 9, 29), s);
  assert.deepStrictEqual([c.resetsOn.getMonth(), c.resetsOn.getDate()], [10, 25]);
  // passage d'année
  assert.strictEqual(q.quotaCycle(new Date(2027, 0, 10), s).key, 'ocr_reads_2026-12-25');
});

test('quotaCycle : jour de paye 31 dans un mois court, mode calendrier avec payDay ignoré', () => {
  assert.strictEqual(q.quotaCycle(new Date(2026, 1, 28, 12), { mode: 'payday', payDay: 31 }).key, 'ocr_reads_2026-02-28');
  assert.strictEqual(q.quotaCycle(new Date(2026, 9, 29), { mode: 'calendar', payDay: 25 }).key, 'ocr_reads_2026-10-01');
});

test('même cycle = même clé ; deux cycles différents = deux clés (compteur indépendant)', () => {
  const a = q.quotaCycle(new Date(2026, 9, 2)).key;
  assert.strictEqual(a, q.quotaCycle(new Date(2026, 9, 30)).key);
  assert.notStrictEqual(a, q.quotaCycle(new Date(2026, 10, 2)).key);
});

test('parseUsed : null, vide, texte, négatif, décimal, valide', () => {
  assert.strictEqual(q.parseUsed(null), 0);
  assert.strictEqual(q.parseUsed(undefined), 0);
  assert.strictEqual(q.parseUsed(''), 0);
  assert.strictEqual(q.parseUsed('abc'), 0);
  assert.strictEqual(q.parseUsed('-3'), 0);
  assert.strictEqual(q.parseUsed('0'), 0);
  assert.strictEqual(q.parseUsed('3'), 3);
  assert.strictEqual(q.parseUsed('4.9'), 4);
});

test('readsLimit : jamais sous 5, une valeur distante ne fait que monter', () => {
  assert.strictEqual(q.readsLimit(), 5);
  assert.strictEqual(q.readsLimit(null), 5);
  for (const v of [0, 1, 4, -10, NaN, -Infinity, '9', undefined]) assert.strictEqual(q.readsLimit(v), 5, String(v));
  assert.strictEqual(q.readsLimit(8), 8);
  assert.strictEqual(q.readsLimit(7.9), 7);
  assert.strictEqual(q.OCR_FREE_READS_PER_CYCLE, 5);
});

test('remainingReads : jamais négatif', () => {
  assert.strictEqual(q.remainingReads(0, 5), 5);
  assert.strictEqual(q.remainingReads(5, 5), 0);
  assert.strictEqual(q.remainingReads(9, 5), 0);
});

test('planReads : assez de solde, partage au-delà, solde 0, illimité', () => {
  assert.deepStrictEqual(q.planReads(2, 5, false), { allowed: 2, truncatedFrom: null, blocked: false });
  assert.deepStrictEqual(q.planReads(5, 5, false), { allowed: 5, truncatedFrom: null, blocked: false });
  assert.deepStrictEqual(q.planReads(6, 3, false), { allowed: 3, truncatedFrom: 6, blocked: false });
  assert.deepStrictEqual(q.planReads(1, 0, false), { allowed: 0, truncatedFrom: null, blocked: true });
  assert.deepStrictEqual(q.planReads(4, 0, false), { allowed: 0, truncatedFrom: null, blocked: true });
  assert.deepStrictEqual(q.planReads(40, 0, true), { allowed: 40, truncatedFrom: null, blocked: false });
  assert.deepStrictEqual(q.planReads(3, Infinity, true), { allowed: 3, truncatedFrom: null, blocked: false });
});

test('6e tentative : 5 lectures consommées → bloqué', () => {
  assert.strictEqual(q.planReads(1, q.remainingReads(5, q.readsLimit()), false).blocked, true);
  assert.strictEqual(q.planReads(1, q.remainingReads(4, q.readsLimit()), false).blocked, false);
});

test('consumedReads : 1 image avec ≥ 1 opération nouvelle = 1 lecture', () => {
  assert.strictEqual(q.consumedReads([]), 0);
  assert.strictEqual(q.consumedReads([{ image: 0 }, { image: 0 }, { image: 0 }]), 1);
  assert.strictEqual(q.consumedReads([{ image: 0 }, { image: 1 }, { image: 1 }, { image: 2 }]), 3);
});

test('consumedReads : doublons forcés ne consomment pas, seuls ou mêlés à de nouvelles', () => {
  assert.strictEqual(q.consumedReads([{ image: 0, forceDuplicate: true }]), 0);
  assert.strictEqual(q.consumedReads([{ image: 0, forceDuplicate: true }, { image: 0 }]), 1);
  assert.strictEqual(q.consumedReads([
    { image: 0, forceDuplicate: true }, { image: 1, forceDuplicate: true }, { image: 2 },
  ]), 1);
  assert.strictEqual(q.consumedReads([{ image: 0, forceDuplicate: false }]), 1);
});

test('consumedReads : opération sans index d\'image ne consomme rien (pas de NaN)', () => {
  assert.strictEqual(q.consumedReads([{}, { forceDuplicate: false }]), 0);
  assert.strictEqual(q.consumedReads([{ image: 0 }, {}]), 1);
});
