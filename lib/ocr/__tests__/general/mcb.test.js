const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parsePage } = require(`${o}/index.js`);
const { parseAmount } = require(`${o}/mcb/amount.js`);
const { parseDateHeader, dateFromReference } = require(`${o}/mcb/dates.js`);
const { classifyLabel } = require(`${o}/mcb/classify.js`);
const fx = require(`${o}/__fixtures__/mcbPages.js`);

test('montants : débit, crédit, exposant, centimes collés', () => {
  assert.deepStrictEqual(parseAmount('MGA -348 120,45'), { cents: 34812045, negative: true, currency: 'MGA', uncertain: false });
  assert.strictEqual(parseAmount('MGA 1 850 000,00').cents, 185000000);
  assert.strictEqual(parseAmount('MGA 1 850 000,00').negative, false);
  assert.strictEqual(parseAmount('MGA -348 12045').cents, 34812045);
  assert.strictEqual(parseAmount('MGA -348 120 45').cents, 34812045);
  assert.strictEqual(parseAmount('MGA -21900,"').cents, 2190000);
  assert.strictEqual(parseAmount('MGA -12 340,', '10').cents, 1234010);
  assert.strictEqual(parseAmount('MGA -150 000,0').cents, 15000000);
});

test('montants : centime manquant = incertain ; texte sans devise = null', () => {
  assert.strictEqual(parseAmount('MGA -12 340,').uncertain, true);
  assert.strictEqual(parseAmount('MGA 348 120,4').uncertain, true);
  assert.strictEqual(parseAmount('Plus de détails'), null);
  assert.strictEqual(parseAmount(''), null);
});

test('dates : en-tête et date julienne', () => {
  assert.strictEqual(parseDateHeader('28 oct. 2026'), '2026-10-28');
  assert.strictEqual(parseDateHeader('09 mars 2026'), '2026-03-09');
  assert.strictEqual(parseDateHeader('3O oct. 2026'), '2026-10-30');
  assert.strictEqual(parseDateHeader('31 nov. 2026'), null);
  assert.strictEqual(parseDateHeader('Transactions'), null);
  assert.strictEqual(dateFromReference('FT26301QW7K2'), '2026-10-28');
  assert.strictEqual(dateFromReference('FT26999ABCDE'), null);
  assert.strictEqual(dateFromReference(null), null);
});

test('libellés : carte, GAB, revenu', () => {
  const c = classifyLabel('DB vente carte etrangere 482913 NETFLIX COM');
  assert.strictEqual(c.kind, 'expense');
  assert.strictEqual(c.merchant, 'NETFLIX COM');
  assert.strictEqual(c.categoryHint, 'bills');
  assert.strictEqual(classifyLabel('Retrait sur GAB confrere 551203 X').kind, 'transfer');
  assert.strictEqual(classifyLabel('Virement recus Banque Confrere ACME').kind, 'income');
  assert.strictEqual(classifyLabel('Salaire').kind, 'income');
  assert.strictEqual(classifyLabel('quelque chose').kind, null);
});

test('page récente : 4 opérations, signes, dates, types', () => {
  const r = parsePage(fx.MCB_RECENT_PAGE);
  assert.strictEqual(r.source, 'mcb');
  assert.strictEqual(r.partial, 0);
  assert.deepStrictEqual(r.operations.map((x) => [x.reference, x.amount, x.kind, x.date]), [
    ['FT26073AB12C', -4825075, 'expense', '2026-03-14'],
    ['FT26073XQ9KD', 185000000, 'income', '2026-03-14'],
    ['FT26071KD3P1', -15000000, 'transfer', '2026-03-12'],
    ['FT26068M2N8R', -1234010, 'expense', '2026-03-09'],
  ]);
});

test('page liste : centimes en exposant, opération coupée comptée', () => {
  const r = parsePage(fx.MCB_LIST_PAGE);
  assert.strictEqual(r.operations.length, 3);
  assert.strictEqual(r.partial, 1);
  assert.deepStrictEqual(r.operations.map((x) => x.amount), [-15000000, -1234010, -2190000]);
});

test('aperçu des comptes : aucune opération, source non reconnue', () => {
  const r = parsePage(fx.MCB_OVERVIEW_PAGE);
  assert.strictEqual(r.operations.length, 0);
  assert.strictEqual(r.source, null);
});

test('signe « - » perdu : montant sombre = débit incertain ; crédit vert inchangé', () => {
  const page = JSON.parse(JSON.stringify(fx.MCB_RECENT_PAGE));
  page.lines.find((l) => l.text === 'MGA -48 250,75').text = 'MGA 48 250,75';
  const r = parsePage(page);
  assert.strictEqual(r.operations[0].amount, -4825075);
  assert.ok(!r.operations[0].uncertain.includes('sign')); // mot-clé « carte » confirme le débit
  assert.strictEqual(r.operations[1].amount, 185000000);
});
