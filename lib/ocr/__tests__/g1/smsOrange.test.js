const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parseSms, parseSmsScreenshot } = require(`${o}/index.js`);
const fields = require(`${o}/sms/fields.js`);

const T = '2026-11-10';
// Page inventée (Google Messages, 1080 px). Un item = { h } en-tête, ou { rows:[...] } une bulle,
// ou { rows, gap } avec écart vertical avant la bulle.
const mk = (text, top, left = 66) => ({ text, left, top, right: 900, bottom: top + 40 });
function page(items, { footer = true } = {}) {
  const lines = [mk('12:57', 40, 60), mk('OrangeMoney', 160, 200), mk('Messages', 230, 300)];
  let y = 330;
  for (const it of items) {
    if (it.h) { lines.push(mk(it.h, y, 300)); y += 110; continue; }
    for (const r of it.rows) { lines.push(mk(r, y)); y += it.step ?? 54; }
    y += 40;
  }
  if (footer) lines.push(mk('L\'expéditeur ne peut pas accepter de réponses.', y + 20), mk('Contactez-le directement. En savoir plus', y + 74));
  return { width: 1080, height: 2400, lines };
}
const read = (items, opts) => parseSmsScreenshot(page(items, opts), T);

const TRANSFERT = [
  'Votre transfert de 20000 AR vers Nom Prenom (03XXXXXXXX) : motif est reussi. Frais: 500 AR.',
  'Votre solde est de 13574 AR.', 'Trans Id : edb34e9e.', 'Date : 2026-06-10 09:47:16.',
];

test('critère 1 : « Date : » du texte gagne sur l\'en-tête, même coupé ou différent', () => {
  let r = read([{ rows: TRANSFERT }]);
  assert.equal(r.operations.length, 2);
  assert.equal(r.operations[0].date, '2026-06-10');
  assert.equal(r.operations[0].reference.toLowerCase(), 'edb34e9e');
  r = read([{ h: 'mardi 23 juin • 17:16' }, { rows: TRANSFERT }]);
  assert.equal(r.operations[0].date, '2026-06-10', 'le texte l\'emporte sur l\'en-tête');
  // « Date : » séparée de sa bulle par un grand écart : reste dans la bulle
  r = read([{ rows: TRANSFERT.slice(0, 3).concat([]) }, { rows: [TRANSFERT[3]], step: 54 }]);
  assert.equal(r.operations[0].date, '2026-06-10');
  assert.equal(r.operations.length, 2);
});

test('critère 1 : MVola « le jj/mm/aa à hh:mm » reste daté par le texte', () => {
  const r = parseSms('Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890', T, '2026-11-02');
  assert.equal(r[0].date, '2026-11-05');
});

test('critère 1 : sans date texte → en-tête, puis réf Orange, puis aujourd\'hui', () => {
  const s = 'Votre achat d\'offre Orange Be connect 1,2Go de 5000Ar est reussi. Nouveau solde : 8574Ar. Trans id: MP260623.1714.C02389. Orange Money vous remercie.';
  assert.equal(parseSms(s, T, '2026-06-24')[0].date, '2026-06-24');
  assert.equal(parseSms(s, T)[0].date, '2026-06-23');
  assert.equal(parseSms(s.replace('MP260623', 'PP261023'), T)[0].date, '2026-10-23');
  assert.equal(parseSms(s.replace('Trans id: MP260623.1714.C02389.', 'Trans id: XYZ12345.'), T)[0].date, T);
});

test('dateOfReference : bornes, invalide, réf MVola chiffrée = null', () => {
  const d = fields.dateOfReference;
  assert.equal(d('MP260623.1714.C02389'), '2026-06-23');
  assert.equal(d('PP261023.0001.A'), '2026-10-23');
  for (const bad of [null, '', '1234567890', '2026061012', 'MP261323.1714.C', 'MP260230.1714.C', 'MP260600.1714.C', 'MP2606231714', 'edb34e9e', 'AB260623'])
    assert.equal(d(bad), null, String(bad));
  assert.equal(d('MP240229.1.C'), '2024-02-29');
  assert.equal(d('MP250229.1.C'), null);
});

test('critère 2 : dernière bulle coupée au bord = partial, jamais importée', () => {
  const full = { rows: ['Votre achat d\'offre Orange Be connect 1,2Go de 5000Ar est reussi. Nouveau solde : 8574Ar. Trans id: MP260623.1714.C02389. Orange Money vous remercie.'] };
  const cut = { rows: ['Votre achat d\'offre Orange Akama Plus de', '1000Ar est reussi. Nouveau solde : 6574Ar.', 'Trans id: MDIANAN'] };
  const r = read([{ h: 'mardi 23 juin • 17:16' }, full, cut]);
  assert.equal(r.operations.length, 1);
  assert.equal(r.partial, 1);
  assert.ok(r.operations.every((x) => !/MDIANAN/.test(x.reference ?? '')));
  // coupée juste après le montant, sans réf
  const r2 = read([full, { rows: ['Votre achat d\'offre Orange Akama Plus de', '1000Ar est reussi.'] }]);
  assert.equal(r2.operations.length, 2);
  assert.equal(r2.partial, 0, 'phrase finie par un point = complète (sans référence → pas de doublon à craindre)');
});

test('critère 2 : seule la DERNIÈRE bulle peut être coupée ; une seule bulle coupée = 0 opération, partial 1', () => {
  const r = read([{ rows: ['Votre achat d\'offre Orange Akama Plus de 1000Ar est reussi. Nouveau solde : 6574Ar. Trans id: MDIANAN'] }]);
  assert.deepEqual([r.operations.length, r.partial], [0, 1]);
});

test('faux « coupée » : dernières bulles complètes restent importées', () => {
  const cases = [
    'Votre paiement de 500 Ar aupres de BOUTIQUE TEST est reussi. Frais: 0 Ar. Nouveau solde: 2000 Ar. Trans Id: MP260630.1801.D11111',
    'Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890',
    'Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890.',
    'Paiement VISA AKORY de 12345.67 Ar reussi, Site: X ,Ref: AB123456789. Frais: 123.4Ar. Solde: 5000 Ar. Trans Id : MP260628.2001.G44444',
    'Vous avez reçu un transfert de 5000 AR venant du 0320000000 : test. Votre solde est de 9000 AR. Trans Id : MP260629.0915.E22222',
  ];
  for (const c of cases) {
    const r = read([{ rows: [c] }]);
    assert.deepEqual([r.operations.length >= 1, r.partial], [true, 0], c);
  }
});

test('critère 3 : « Trans Id : 03959715 » et lecture OCR « Trans ld » donnent la référence', () => {
  for (const form of ['Trans Id : 03959715', 'Trans ld : 03959715', 'Trans 1d: 03959715', 'Trans |d : 03959715']) {
    const r = parseSms(`Vous avez reçu un transfert de 5000 AR venant du 0320000000 : test. ${form}. Date : 2026-06-10 09:39:32.`, T);
    assert.equal(r[0]?.reference, '03959715', form);
  }
  assert.equal(fields.referenceOf('Votre solde est de 13574 AR. Trans Id : 03959715.'), '03959715');
  assert.equal(fields.referenceOf('Transaction reussie, merci'), null);
});

test('critère 4 : nom d\'offre dans le libellé, pas de faux nom', () => {
  assert.equal(fields.offerNameOf('Votre achat d\'offre Orange Be connect 1,2Go de 5000Ar est reussi.'), 'Be connect 1,2Go');
  assert.equal(fields.offerNameOf('L achat de votre offre NET MONTH 15 000 avec MVola est reussi.'), 'NET MONTH');
  assert.equal(fields.offerNameOf('Bravo! MVola vous offre 90 j de validité supplémentaire'), null);
  assert.equal(fields.offerNameOf('Retrait reussi: 1 000 Ar'), null);
  assert.equal(fields.offerNameOf(''), null);
  const a = parseSms('Votre achat d\'offre Orange Be connect 1,2Go de 5000Ar est reussi. Nouveau solde : 8574Ar. Trans id: MP260623.1714.C02389.', T)[0];
  assert.match(a.note, /· Be connect 1,2Go$/);
  assert.equal(parseSms(a.label, T, null, 'orange-money')[0].note, 'Orange Money · Be connect 1,2Go');
  const m = parseSms('L achat de votre offre NET MONTH 15 000 avec MVola est reussi. Vous avez 3200Mo utilisable a toute heure.', T)[0];
  assert.equal(m.note, 'MVola · NET MONTH');
  // la contrepartie prime sur le nom d'offre
  const t = parseSms('Vous avez reçu un transfert de 5000 AR venant du 0320000000 : test. Trans Id : MP260629.0915.E22222', T)[0];
  assert.doesNotMatch(t.note, /offre/i);
});

test('critère 5 : bulle partielle du haut + suivante collée, une opération chacune sans fusion', () => {
  const r = read([
    { rows: ['Votre solde est de 13574 AR.', 'Trans Id : 03959715.', 'Date : 2026-06-10 09:39:32.'] },
    { rows: TRANSFERT },
  ]);
  assert.equal(r.operations.length, 2, JSON.stringify(r.operations.map((x) => [x.label, x.amount])));
  assert.equal(r.partial, 0);
});

test('Coller un SMS : réf chiffrée MVola ne donne pas de date, pas de nom d\'offre parasite', () => {
  const r = parseSms('Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001. Frais: 0 Ar. Ref: 261023123456', T);
  assert.equal(r[0].date, T);
  assert.doesNotMatch(r[0].note, /offre/i);
});
