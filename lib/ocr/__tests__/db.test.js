const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { migrateDatabase } = require(`${o}/../database/migrations.js`);
const { restoreDatabase } = require(`${o}/../backup/deserialize.js`);

/** Faux SQLite : suit seulement colonnes de transactions et user_version. */
function fakeDb(version, txColumns) {
  const cols = new Set(txColumns);
  const log = [];
  const db = {
    log, cols, version,
    execAsync: async (sql) => {
      log.push(sql);
      const m = /user_version = (\d+)/.exec(sql);
      if (m) db.version = +m[1];
      if (/ALTER TABLE transactions ADD COLUMN external_ref/.test(sql)) {
        if (cols.has('external_ref')) throw new Error('duplicate column name');
        cols.add('external_ref');
      }
    },
    getFirstAsync: async () => ({ user_version: db.version }),
    getAllAsync: async (sql) => (/table_info\(transactions\)/.test(sql) ? [...cols].map((name) => ({ name })) : []),
  };
  return db;
}
const BASE = ['id', 'type', 'amount', 'note'];

test('migration 25 → 26 : colonne + index partiel, version 26', async () => {
  const db = fakeDb(25, BASE);
  await migrateDatabase(db);
  assert.ok(db.cols.has('external_ref'));
  assert.ok(db.log.some((s) => /idx_transactions_external_ref[\s\S]*WHERE external_ref IS NOT NULL/.test(s)));
  assert.strictEqual(db.version, 26);
});

test('migration v26 idempotente : colonne déjà présente → pas de nouvel ALTER, pas de DROP', async () => {
  const db = fakeDb(25, [...BASE, 'external_ref']);
  await migrateDatabase(db);
  assert.strictEqual(db.version, 26);
  assert.ok(!db.log.some((s) => /ADD COLUMN external_ref/.test(s)));
  assert.ok(!db.log.some((s) => /DROP|DELETE FROM/i.test(s)));
});

test('base déjà en v26 : rien à faire', async () => {
  const db = fakeDb(26, [...BASE, 'external_ref']);
  await migrateDatabase(db);
  assert.ok(!db.log.some((s) => /ADD COLUMN|CREATE INDEX/.test(s)));
});

function restoreDb(columns) {
  const inserts = [];
  const txn = {
    execAsync: async () => {},
    getAllAsync: async (sql) => (/table_info/.test(sql) ? columns.map((name) => ({ name })) : []),
    runAsync: async (sql, values) => { inserts.push({ sql, values }); },
  };
  return { inserts, db: { withExclusiveTransactionAsync: (fn) => fn(txn) } };
}

test('restauration : ancienne sauvegarde (sans external_ref) dans une base v26', async () => {
  const { db, inserts } = restoreDb([...BASE, 'external_ref']);
  await restoreDatabase(db, { transactions: [{ id: 't1', type: 'expense', amount: 100, note: 'x' }] });
  const ins = inserts.find((i) => /INSERT OR REPLACE INTO transactions/.test(i.sql));
  assert.ok(ins);
  assert.ok(!/external_ref/.test(ins.sql));
  assert.deepStrictEqual(ins.values, ['t1', 'expense', 100, 'x']);
});

test('restauration : sauvegarde v26 dans une base v26 garde external_ref, et dans une base v25 l’ignore', async () => {
  const row = { id: 't1', type: 'expense', amount: 100, note: 'x', external_ref: 'mcb:FT26301AAAAA' };
  const a = restoreDb([...BASE, 'external_ref']);
  await restoreDatabase(a.db, { transactions: [row] });
  assert.ok(a.inserts.some((i) => /external_ref/.test(i.sql) && i.values.includes('mcb:FT26301AAAAA')));
  const b = restoreDb(BASE);
  await restoreDatabase(b.db, { transactions: [row] });
  const ins = b.inserts.find((i) => /INTO transactions/.test(i.sql));
  assert.ok(ins && !/external_ref/.test(ins.sql));
});
