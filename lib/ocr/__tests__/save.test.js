const test = require('node:test');
const assert = require('node:assert');
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const o = process.env.OCR_OUT;
const src = fs.readFileSync(path.join(__dirname, '../import/save.ts'), 'utf8');
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

test('transfert forcé : 2 lignes insérées, compte 1', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY'), leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db, [transfer({ forceDuplicate: true })]), 1);
  assert.strictEqual(db.rows.length, 4);
});

test('doublon forcé simple enregistré', async () => {
  const db = fakeDb([leg('mcb:FT262731MRWY')]);
  assert.strictEqual(await saveImportedOperations(db, [draft({ forceDuplicate: true })]), 1);
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
  assert.strictEqual(n, 3);
  assert.strictEqual(db.rows.length, 1 + 1 + 1 + 2);
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
