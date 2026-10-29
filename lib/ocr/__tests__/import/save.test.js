const test = require('node:test');
const assert = require('node:assert');
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const o = process.env.OCR_OUT;
const src = fs.readFileSync(path.join(__dirname, '../../import/save.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
const bumps = { n: 0 };
const stubs = {
  '@/lib/database/schema': { SYSTEM_CATEGORY_INCOME_ID: 'cat-inc', SYSTEM_CATEGORY_TRANSFER_ID: 'cat-tr' },
  '@/stores/dataRefreshStore': { useDataRefreshStore: { getState: () => ({ bumpAll: () => { bumps.n++; } }) } },
  '../dedupe': require(`${o}/dedupe.js`),
};
const mod = { exports: {} };
new Function('require', 'module', 'exports', js)((n) => stubs[n], mod, mod.exports);
const { saveImportedOperations } = mod.exports;

/** Faux db : rows = transactions en mémoire ; failAt = insertion qui échoue (transaction annulée). */
function fakeDb(rows, failAt = -1) {
  const db = { rows: rows.map((r) => ({ ...r })) };
  db.withExclusiveTransactionAsync = async (cb) => {
    const snapshot = db.rows.map((r) => ({ ...r }));
    let n = 0;
    const txn = {
      getAllAsync: async () => db.rows.filter((r) => r.deleted_at == null && r.external_ref != null).map((r) => ({ external_ref: r.external_ref })),
      runAsync: async (_sql, p) => {
        if (n++ === failAt) throw new Error('boom');
        db.rows.push({ type: p[1], amount: p[2], external_ref: p[10], deleted_at: null });
      },
    };
    try { await cb(txn); } catch (e) { db.rows = snapshot; throw e; }
  };
  return db;
}

const draft = (over = {}) => ({
  kind: 'expense', amount: 1000, categoryId: 'c1', accountId: 'a1', counterAccountId: null,
  direction: 'debit', date: '2026-09-30', note: '', externalRef: 'mcb:FT262731MRWY', ...over,
});
const transfer = (over = {}) => draft({ kind: 'transfer', counterAccountId: 'cash', amount: 10000000, ...over });
const leg = (ref, extra = {}) => ({ external_ref: ref, deleted_at: null, ...extra });

test('réf identique en base : ignoré, compte 0', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db, [draft()]), 0);
  assert.strictEqual(db.rows.length, 1);
});

test('réf canonique O/0 et I/1 : ignoré', async () => {
  const db = fakeDb([leg('mcb:FT26273L7KTQ')]);
  assert.strictEqual(await saveImportedOperations(db, [draft({ externalRef: 'mcb:FT2627317KTQ' })]), 0);
  const db2 = fakeDb([leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db2, [draft({ externalRef: 'mcb:FT26273LMRWY' })]), 0);
  const db3 = fakeDb([leg('mcb:FT2627O1MRWY')]);
  assert.strictEqual(await saveImportedOperations(db3, [draft({ externalRef: 'mcb:FT262701MRWY' })]), 0);
});

test('réf inconnue ou absente : insérée', async () => {
  const db = fakeDb([leg('mcb:AAA')]);
  assert.strictEqual(await saveImportedOperations(db, [draft(), draft({ externalRef: null }), draft({ externalRef: null })]), 3);
  assert.strictEqual(db.rows.length, 4);
});

test('régression réel : retrait GAB 100 000,00 déjà en 2 jambes, réimport non signalé = 0', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY', { type: 'expense', amount: 10000000 }), leg('mcb:FT262731MRWY', { type: 'income', amount: 10000000 })]);
  assert.strictEqual(await saveImportedOperations(db, [transfer()]), 0);
  assert.strictEqual(db.rows.length, 2);
});

test('transfert dont la réf est en base, même forcé : jamais inséré', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY'), leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db, [transfer({ forceDuplicate: true })]), 0);
  assert.strictEqual(db.rows.length, 2);
});

test('réf en base + forceDuplicate : jamais insérée (simple, canonique O/0)', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db, [draft({ forceDuplicate: true })]), 0);
  assert.strictEqual(await saveImportedOperations(db, [draft({ externalRef: 'mcb:FT26273LMRWY', forceDuplicate: true })]), 0);
  assert.strictEqual(db.rows.length, 1);
});

test('doublon du lot forcé : les deux insérés ; transfert du lot forcé : 2 jambes chacun', async () => {
  const db = fakeDb([]);
  const n = await saveImportedOperations(db, [draft({ externalRef: 'mcb:Z1' }), draft({ externalRef: 'mcb:Z1', forceDuplicate: true })]);
  assert.strictEqual(n, 2);
  assert.strictEqual(db.rows.length, 2);
  const db2 = fakeDb([]);
  assert.strictEqual(await saveImportedOperations(db2, [transfer({ externalRef: 'mcb:Z2' }), transfer({ externalRef: 'mcb:Z2', forceDuplicate: true })]), 2);
  assert.strictEqual(db2.rows.length, 4);
});

test('sans référence, forcé : inséré', async () => {
  const db = fakeDb([leg('mcb:K9')]);
  assert.strictEqual(await saveImportedOperations(db, [draft({ externalRef: null, forceDuplicate: true })]), 1);
  assert.strictEqual(db.rows.length, 2);
});

test('ligne soft-deleted : réinsérée', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY', { deleted_at: '2026-10-01' })]);
  assert.strictEqual(await saveImportedOperations(db, [draft()]), 1);
  assert.strictEqual(db.rows.length, 2);
});

test('doublon intra-lot non forcé : inséré une seule fois (et canonique)', async () => {
  const db = fakeDb([]);
  const n = await saveImportedOperations(db, [draft(), draft({ externalRef: 'mcb:FT26273LMRWY' }), transfer()]);
  assert.strictEqual(n, 1);
  assert.strictEqual(db.rows.length, 1);
});

test('compte retourné = mélange ignorés / insérés / forcés', async () => {
  const db = fakeDb([leg('mcb:K1')]);
  const n = await saveImportedOperations(db, [
    draft({ externalRef: 'mcb:K1' }), draft({ externalRef: 'mcb:K1', forceDuplicate: true }),
    draft({ externalRef: 'mcb:N1' }), transfer({ externalRef: 'mcb:N2' }),
  ]);
  assert.strictEqual(n, 2);
  assert.strictEqual(db.rows.length, 1 + 1 + 2);
});

test('erreur en cours : la fonction rejette (pas de compte) et rien n\'est gardé', async () => {
  const db = fakeDb([], 1);
  await assert.rejects(saveImportedOperations(db, [draft({ externalRef: 'mcb:A' }), draft({ externalRef: 'mcb:B' })]));
  assert.strictEqual(db.rows.length, 0);
});

test('liste vide : 0', async () => {
  assert.strictEqual(await saveImportedOperations(fakeDb([]), []), 0);
});

test('bumpAll appelé après succès', async () => {
  const before = bumps.n;
  await saveImportedOperations(fakeDb([]), [draft()]);
  assert.strictEqual(bumps.n, before + 1);
});

test('onInserted : reçoit seulement les opérations réellement insérées, après la transaction, avant bumpAll', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY')]);
  const seen = [];
  const before = bumps.n;
  let bumpedWhenCalled = null;
  const n = await saveImportedOperations(
    db,
    [draft({ image: 0 }), draft({ externalRef: 'mcb:FT00000NEW01', image: 1 }), draft({ externalRef: null, image: 2, forceDuplicate: true })],
    (ins) => { bumpedWhenCalled = bumps.n; seen.push(...ins); }
  );
  assert.strictEqual(n, 2);
  assert.deepStrictEqual(seen.map((d) => d.image), [1, 2]);
  assert.strictEqual(bumpedWhenCalled, before);
  assert.strictEqual(bumps.n, before + 1);
});

test('onInserted : jamais appelé quand l\'enregistrement échoue (aucune lecture consommée)', async () => {
  const db = fakeDb([], 0);
  let called = false;
  await assert.rejects(saveImportedOperations(db, [draft()], () => { called = true; }));
  assert.strictEqual(called, false);
});

test('onInserted : liste vide si tout est ignoré ; sans callback inchangé', async () => {
  let got = null;
  await saveImportedOperations(fakeDb([leg('mcb:FT262731MRWY')]), [draft()], (ins) => { got = ins; });
  assert.deepStrictEqual(got, []);
  assert.strictEqual(await saveImportedOperations(fakeDb([]), [draft()]), 1);
});
