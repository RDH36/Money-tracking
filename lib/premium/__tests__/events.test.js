// Events PostHog de l'import : tranches seulement, jamais de montant, libellé ni jeton.
const { test } = require('node:test');
const assert = require('node:assert');
const { join } = require('node:path');
const a = require(join(process.env.ANALYTICS_OUT, 'analytics.js'));

const op = { source: 'mcb', reference: 'FT99', date: '2026-10-28', label: 'SECRET LABEL', note: 'SECRET NOTE', amount: -1234567, kind: 'expense' };
const item = (p = {}) => ({ op, duplicate: null, amount: 1234567, date: op.date, kind: 'expense', note: 'SECRET NOTE', forceDuplicate: false, ...p });

test('countBucket : limites 0 1 2-5 6-10 11+', () => {
  const b = a.countBucket;
  assert.deepStrictEqual([-1, 0, 1, 2, 5, 6, 10, 11, 99].map(b), ['0', '0', '1', '2-5', '2-5', '6-10', '6-10', '11+', '11+']);
});

test('readKind : sources connues, inconnue, vide', () => {
  assert.strictEqual(a.readKind(['mcb']), 'mcb');
  assert.strictEqual(a.readKind(['boa-gab', 'mcb']), 'boa_gab');
  assert.strictEqual(a.readKind(['bmoi-tpe']), 'bmoi_tpe');
  assert.strictEqual(a.readKind(['receipt']), 'receipt');
  assert.strictEqual(a.readKind(['autre']), 'unknown');
  assert.strictEqual(a.readKind([]), 'unknown');
});

test('readCompletedProps : kind, ops_bucket, new_ops_bucket, rien d\'autre', () => {
  const items = [item(), item({ duplicate: 'similar' }), item({ duplicate: 'reference' })];
  const p = a.readCompletedProps(items, ['mcb']);
  assert.deepStrictEqual(p, { kind: 'mcb', ops_bucket: '2-5', new_ops_bucket: '1' });
});

test('importSavedProps : modifiées et doublons comptés, aucune donnée sensible', () => {
  const inserted = [item(), item({ amount: 5 }), item({ note: 'autre', forceDuplicate: true, duplicate: 'similar' })];
  const p = a.importSavedProps(inserted);
  assert.deepStrictEqual(p, { ops_bucket: '2-5', edited_bucket: '2-5', duplicates_bucket: '1' });
  const json = JSON.stringify([p, a.readCompletedProps(inserted, ['mcb'])]);
  assert.ok(!/SECRET|1234567|FT99/.test(json));
  assert.deepStrictEqual(a.importSavedProps([]), { ops_bucket: '0', edited_bucket: '0', duplicates_bucket: '0' });
});

test('isEdited : inchangée = faux, montant/date/type/note changés = vrai', () => {
  assert.strictEqual(a.isEdited(item()), false);
  assert.strictEqual(a.isEdited(item({ amount: 1 })), true);
  assert.strictEqual(a.isEdited(item({ date: '2026-10-01' })), true);
  assert.strictEqual(a.isEdited(item({ kind: 'income' })), true);
  assert.strictEqual(a.isEdited(item({ note: 'x' })), true);
});
