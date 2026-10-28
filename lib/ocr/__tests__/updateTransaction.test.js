const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/** Charge lib/database/updateTransaction.ts avec un faux dataRefreshStore. */
const bumps = { n: 0 };
function load() {
  const src = ts.transpileModule(read('lib/database/updateTransaction.ts'), { compilerOptions: { module: 'commonjs', target: 'es2020' } }).outputText;
  const mod = { exports: {} };
  const req = (name) => {
    assert.strictEqual(name, '@/stores/dataRefreshStore');
    return { useDataRefreshStore: { getState: () => ({ bumpAll: () => { bumps.n++; } }) } };
  };
  new Function('module', 'exports', 'require', src)(mod, mod.exports, req);
  return mod.exports.updateTransaction;
}
const updateTransaction = load();

/** Faux db : lignes en mémoire, soldes recalculés comme useAccounts (hors deleted_at). */
function fakeDb(accounts, rows) {
  const updates = [];
  const balance = (id) =>
    accounts[id] + rows.filter((r) => r.account_id === id && !r.deleted_at)
      .reduce((s, r) => s + (r.type === 'income' ? r.amount : -r.amount), 0);
  return {
    updates,
    balance,
    getAllAsync: async (sql, p) => {
      assert.match(sql, /deleted_at IS NULL/);
      const f = /transfer_id = \?/.test(sql) ? (r) => r.transfer_id === p[0] : (r) => r.id === p[0];
      return rows.filter((r) => f(r) && !r.deleted_at).map(({ id, type, amount, account_id }) => ({ id, type, amount, account_id }));
    },
    getFirstAsync: async (sql, p) => {
      assert.match(sql, /t\.deleted_at IS NULL/);
      return { balance: balance(p[0]) };
    },
    withExclusiveTransactionAsync: async (fn) => fn({
      runAsync: async (sql, params) => {
        updates.push({ sql, params });
        const row = rows.find((r) => r.id === params[params.length - 1]);
        row.amount = params[0]; row.account_id = params[3];
      },
    }),
  };
}
const exp = (o) => ({ id: 'e1', type: 'expense', amount: 1000, account_id: 'A', transfer_id: null, ...o });
const ed = (o) => ({ amount: 1000, transactionDate: '2026-10-01T08:00:00.000Z', note: 'n', categoryId: 'c2', accountId: 'A', ...o });

test('dépense : montant, date, note, catégorie, compte mis à jour ; created_at jamais touché', async () => {
  const db = fakeDb({ A: 5000, B: 5000 }, [exp()]);
  bumps.n = 0;
  const res = await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 2500, accountId: 'B' }));
  assert.deepStrictEqual(res, { ok: true });
  assert.strictEqual(db.updates.length, 1);
  const { sql, params } = db.updates[0];
  assert.doesNotMatch(sql, /created_at/);
  assert.match(sql, /transaction_date = \?/);
  assert.match(sql, /category_id = \?/);
  assert.deepStrictEqual([params[0], params[1], params[2], params[3]], [2500, '2026-10-01T08:00:00.000Z', 'n', 'B']);
  assert.strictEqual(params.includes('c2'), true);
  assert.strictEqual(db.balance('A'), 5000);
  assert.strictEqual(db.balance('B'), 2500);
  assert.strictEqual(bumps.n, 1);
});

test('revenu : catégorie inchangée (pas de category_id dans l\'UPDATE)', async () => {
  const db = fakeDb({ A: 0 }, [exp({ type: 'income' })]);
  const res = await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 3000 }));
  assert.strictEqual(res.ok, true);
  assert.doesNotMatch(db.updates[0].sql, /category_id|created_at/);
  assert.strictEqual(db.balance('A'), 3000);
});

const transferRows = () => [
  exp({ id: 'o', amount: 1000, account_id: 'A', transfer_id: 't1' }),
  exp({ id: 'i', type: 'income', amount: 1000, account_id: 'B', transfer_id: 't1' }),
];

test('transfert : 2 UPDATE, débit sur la jambe dépense, crédit sur la jambe revenu, catégorie intacte', async () => {
  const db = fakeDb({ A: 5000, B: 0 }, transferRows());
  const res = await updateTransaction(db, { id: 'o', transfer_id: 't1' }, ed({ amount: 2000, accountId: 'C', toAccountId: 'A' }));
  assert.strictEqual(res.ok, true);
  assert.strictEqual(db.updates.length, 2);
  for (const u of db.updates) assert.doesNotMatch(u.sql, /category_id|created_at/);
  const byId = Object.fromEntries(db.updates.map((u) => [u.params[u.params.length - 1], u.params]));
  assert.strictEqual(byId.o[3], 'C');
  assert.strictEqual(byId.i[3], 'A');
  assert.strictEqual(byId.o[0], 2000);
  assert.strictEqual(byId.i[0], 2000);
});

test('transfert : from = to refusé, to absent refusé, rien écrit', async () => {
  const db = fakeDb({ A: 5000, B: 0 }, transferRows());
  for (const e of [ed({ accountId: 'A', toAccountId: 'A' }), ed({ accountId: 'A', toAccountId: null })]) {
    const res = await updateTransaction(db, { id: 'o', transfer_id: 't1' }, e);
    assert.strictEqual(res.ok, false);
  }
  assert.strictEqual(db.updates.length, 0);
});

test('solde négatif refusé : dépense relevée au-delà du solde', async () => {
  const db = fakeDb({ A: 1500 }, [exp()]); // solde 500
  const res = await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 1600 }));
  assert.deepStrictEqual(res, { ok: false, error: 'errors.insufficientBalance' });
  assert.strictEqual(db.updates.length, 0);
  assert.strictEqual((await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 1500 }))).ok, true);
});

test('changement de compte vers un compte trop pauvre refusé ; transfert qui vide la source refusé', async () => {
  const db = fakeDb({ A: 5000, B: 100 }, [exp()]);
  const r = await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ accountId: 'B' }));
  assert.strictEqual(r.error, 'errors.insufficientBalance');
  const db2 = fakeDb({ A: 1200, B: 0 }, transferRows());
  const r2 = await updateTransaction(db2, { id: 'o', transfer_id: 't1' }, ed({ amount: 1300, accountId: 'A', toAccountId: 'B' }));
  assert.strictEqual(r2.error, 'errors.insufficientBalance');
});

test('modification qui ne baisse pas le solde acceptée même si le compte est déjà négatif', async () => {
  const db = fakeDb({ A: 0 }, [exp({ amount: 1000 })]); // solde -1000
  assert.strictEqual(db.balance('A'), -1000);
  assert.strictEqual((await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 400 }))).ok, true);
  assert.strictEqual((await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount: 400, note: 'x' }))).ok, true);
  assert.strictEqual(db.balance('A'), -400);
});

test('montant ≤ 0 refusé ; transaction supprimée/introuvable refusée', async () => {
  const db = fakeDb({ A: 5000 }, [exp()]);
  for (const amount of [0, -5]) assert.strictEqual((await updateTransaction(db, { id: 'e1', transfer_id: null }, ed({ amount }))).ok, false);
  const gone = fakeDb({ A: 5000 }, [exp({ deleted_at: 'x' })]);
  assert.strictEqual((await updateTransaction(gone, { id: 'e1', transfer_id: null }, ed())).ok, false);
  assert.strictEqual(db.updates.length + gone.updates.length, 0);
});

test('aucune XP : updateTransaction ne touche pas la gamification', () => {
  const src = read('lib/database/updateTransaction.ts');
  assert.doesNotMatch(src, /from .*gamification|addXp|awardXp/i);
  assert.doesNotMatch(read('components/transactions/EditTransactionSheet.tsx'), /gamification|addXp|awardXp/i);
});

test('historique sur la date de saisie : created_at (filtre du mois, jours, ORDER BY, carte Aujourd\'hui)', () => {
  assert.match(read('hooks/useTransactions.ts'), /ORDER BY t\.created_at DESC/);
  assert.doesNotMatch(read('hooks/useTransactions.ts'), /ORDER BY COALESCE\(t\.transaction_date/);
  assert.match(read('app/(tabs)/history.tsx'), /isSameDay\(tx\.created_at, now\)/);
  assert.doesNotMatch(read('app/(tabs)/history.tsx'), /isSameDay\(tx\.transaction_date/);
  assert.match(read('app/transactions.tsx'), /const d = new Date\(tx\.created_at\)/);
  assert.match(read('components/transactions/TransactionsList.tsx'), /item\.transaction\.created_at/);
  assert.doesNotMatch(read('components/transactions/TransactionsList.tsx'), /item\.transaction\.transaction_date \|\|/);
});
