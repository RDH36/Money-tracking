const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parsePage, detectSource, dedupeOperations } = require(`${o}/index.js`);
const { toYmd } = require(`${o}/text.js`);
const fx = require(`${o}/__fixtures__/ticketPages.js`);
const mcb = require(`${o}/__fixtures__/mcbPages.js`);

const L = (text, top, left = 190, right = 600, color = '#1b2b5b') => ({ text, left, top, right, bottom: top + 34, color });
const today = toYmd(new Date());
const ymd = (daysAgo) => toYmd(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - daysAgo));

// Relevé inventé, forme d'appli bancaire : 3 retraits identiques le même jour.
const retraits = [953, 1141, 1329].flatMap((y) => [
  L('RETRAIT GAB BANQUE', y, 190, 404), L('-MGA 200 000.00', y + 22, 638, 888, '#0f8a8a'),
  L('30-10-2026-GAB 101 22 HA', y + 45, 190, 532), L('VILLE NORD-RET...', y + 79, 190, 418),
]);
const BANK = { width: 946, height: 2049, lines: [
  L('16:59', 40, 40, 110, '#ffffff'), L('DUPONT', 150, 92, 450, '#ffffff'),
  L('Comptes', 460, 86, 205), L('Transactions', 640, 58, 310, '#000000'), L('[Voir historique]', 640, 662, 862),
  L('COTISATION PACKAGE', 765, 190, 484), L('-MGA 17 999.99', 787, 672, 888, '#0f8a8a'),
  L('30-10-2026- SUR PACK TEST', 810, 190, 580),
  ...retraits,
  L('Accueil', 1840, 60, 146), L('Cartes', 1840, 244, 322),
] };

test('relevé générique : titre + montant + date du libellé, 3 retraits identiques gardés', () => {
  const r = parsePage(BANK);
  assert.strictEqual(r.source, 'generic');
  assert.strictEqual(r.operations.length, 4);
  const w = r.operations.filter((x) => x.amount === -20000000);
  assert.strictEqual(w.length, 3);
  for (const x of r.operations) assert.strictEqual(x.date, '2026-10-30');
  assert.strictEqual(r.operations[0].kind, 'expense');
  assert.ok(w.every((x) => x.kind === 'transfer')); // retrait d'espèces, comme pour MCB
  assert.strictEqual(r.operations[0].amount, -1799999);
  assert.match(w[0].note, /RETRAIT GAB/);
});

test('3 retraits identiques d une même image → 0 doublon, mais autre image → doublons', () => {
  const ops = parsePage(BANK).operations;
  const one = dedupeOperations(ops.map((x) => ({ ...x, image: 0 })), []);
  assert.deepStrictEqual(one.items.map((i) => i.duplicate), [null, null, null, null]);
  const two = dedupeOperations([...ops.map((x) => ({ ...x, image: 0 })), ...ops.map((x) => ({ ...x, image: 1 }))], []);
  assert.strictEqual(two.items.filter((i) => i.duplicate === 'batch').length, 4);
  // image 1 montre 2 retraits seulement : le 3e de l'image 0 reste, rien n'est perdu
  const w = ops.filter((x) => x.amount === -20000000);
  const mix = dedupeOperations([...w.map((x) => ({ ...x, image: 0 })), ...w.slice(0, 2).map((x) => ({ ...x, image: 1 }))], []);
  assert.deepStrictEqual(mix.items.map((i) => i.duplicate), [null, null, null, 'batch', 'batch']);
  // sans image : ancien comportement (doublon dès le 2e)
  const old = dedupeOperations(w, []);
  assert.deepStrictEqual(old.items.map((i) => i.duplicate), [null, 'batch', 'batch']);
});

test('en-têtes Aujourd hui / Hier / JJ/MM/AAAA, soldes ignorés', () => {
  const page = { width: 900, height: 1800, lines: [
    L('Solde disponible', 100), L('1 250 000 Ar', 134, 600, 880),
    L("Aujourd'hui", 200),
    L('Courses marche', 260), L('-12 500 Ar', 262, 660, 880),
    L('Hier', 340),
    L('Salaire', 400), L('+450 000 Ar', 402, 660, 880),
    L('05/11/2026', 480),
    L('Facture eau', 540), L('-8 000 Ar', 542, 660, 880),
  ] };
  const r = parsePage(page);
  assert.strictEqual(r.source, 'generic');
  assert.deepStrictEqual(r.operations.map((x) => [x.date, x.amount, x.kind]), [
    [today, -1250000, 'expense'], [ymd(1), 45000000, 'income'], ['2026-11-05', -800000, 'expense'],
  ]);
  assert.ok(!r.operations.some((x) => Math.abs(x.amount) === 125000000));
});

test('signe absent : couleur et mots-clés, sinon « à vérifier »', () => {
  const page = { width: 900, height: 1800, lines: [
    L("Aujourd'hui", 200),
    L('Reception virement', 260), L('50 000 Ar', 262, 660, 880),
    L('Divers', 340), L('7 000 Ar', 342, 660, 880),
  ] };
  const r = parsePage(page);
  assert.strictEqual(r.operations.length, 2);
  assert.strictEqual(r.operations[0].kind, 'income');
  assert.strictEqual(r.operations[1].kind, 'expense');
  assert.ok(r.operations[1].uncertain.includes('sign'));
});

test('non-régression : MCB, GAB, TPE, reçu gardent leur source', () => {
  assert.strictEqual(parsePage(mcb.MCB_RECENT_PAGE).source, 'mcb');
  assert.strictEqual(parsePage(mcb.MCB_LIST_PAGE).source, 'mcb');
  assert.strictEqual(parsePage(fx.GAB_PAGE).source, 'boa-gab');
  assert.strictEqual(parsePage(fx.GAB_TILTED_PAGE).source, 'boa-gab');
  assert.strictEqual(parsePage(fx.TPE_PAGE).source, 'bmoi-tpe');
  assert.strictEqual(parsePage(fx.RECEIPT_PAGE).source, 'receipt');
});

test('ticket de caisse sans total lu : pas pris par le générique', () => {
  const lines = fx.RECEIPT_PAGE.lines.filter((l) => !/total|a payer|montant/i.test(l.text));
  const r = parsePage({ ...fx.RECEIPT_PAGE, lines });
  assert.notStrictEqual(r.source, 'generic');
  assert.strictEqual(detectSource({ ...fx.RECEIPT_PAGE, lines }) === null || detectSource({ ...fx.RECEIPT_PAGE, lines }).id !== 'generic', true);
});

test('page sans montant ou une seule ligne : non reconnue', () => {
  assert.strictEqual(parsePage({ width: 900, height: 900, lines: [L('Bonjour', 100), L('Menu', 200)] }).source, null);
  const one = parsePage({ width: 900, height: 900, lines: [L('Achat', 100), L('-5 000 Ar', 102, 660, 880)] });
  assert.notStrictEqual(one.source, 'generic');
});
