const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parseSms } = require(`${o}/index.js`);
const { fixDigitConfusions: fix, cleanParty } = require(`${o}/sms/fields.js`);

const T = '2026-11-10';
const core = (r) => r.map((x) => [x.date, x.amount, x.kind, x.reference]);

// Fixtures inventées : un même SMS propre, puis lu avec des confusions de police.
const OM = 'Vous avez reçu un transfert de 15000 AR venant du 0320000000 : test. Votre solde est de 29000 AR. Trans Id : 89837309.';
const MV = 'Retrait reussi: 12 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 400 Ar. Ref: 1234567890';

test('Orange : bloc propre = variantes O/o/0, I/l/|/1, S/5, B/8 dans montant et réf', () => {
  const base = core(parseSms(OM, T));
  assert.deepEqual(base, [[T, 1500000, 'income', '89837309']]);
  const variants = [
    OM.replace('15000', '15OOO'), OM.replace('15000', '15ooo'), OM.replace('15000', '1S000'),
    OM.replace('15000', 'l5000'), OM.replace('15000', '|5000'), OM.replace('15000', 'I5000'),
    OM.replace('89837309', '898373O9'), OM.replace('89837309', 'B9837309'), OM.replace('89837309', '8983730S').replace('0S', '09'),
    OM.replace('89837309', '8983S309').replace('S', '7'),
    OM.replace('15000', '15OOO').replace('89837309', '898373O9'),
    OM.replace('29000', '2SOOO'),
  ];
  for (const v of variants) assert.deepEqual(core(parseSms(v, T)), base, v);
  assert.equal(parseSms(OM.replace('89837309', '8983730S'), T)[0].reference, '89837305');
  assert.equal(parseSms(OM.replace('89837309', 'B9837309'), T)[0].reference, '89837309');
  assert.equal(parseSms(OM.replace('89837309', '898373O9'), T)[0].reference, '89837309');
});

test('MVola : bloc propre = variantes dans montant, frais et réf', () => {
  const base = core(parseSms(MV, T));
  assert.deepEqual(base.map((b) => b[1]), [-1200000, -40000]);
  const variants = [
    MV.replace('12 000', '12 0OO'), MV.replace('12 000', '12OOO'), MV.replace('Frais: 400', 'Frais: 4OO'),
    MV.replace('1234567890', '123456789O'), MV.replace('1234567890', 'l234567890'),
    MV.replace('1234567890', '|234567890'), MV.replace('1234567890', 'I234567890'),
    MV.replace('12 000', '12 0O0').replace('Frais: 400', 'Frais: 4OO').replace('1234567890', '123456789O'),
  ];
  for (const v of variants) assert.deepEqual(core(parseSms(v, T)), base, v);
});

test('fragments recollés (retours à la ligne) = même opération qu\'en bloc', () => {
  const frag = MV.replace('. Frais', '\nFrais').replace(' le 05', '\nle 05');
  assert.deepEqual(core(parseSms(frag.replace(/\n/g, ' '), T)), core(parseSms(MV, T)));
});

test('fixDigitConfusions : nombres corrigés', () => {
  assert.equal(fix('5O0'), '500');
  assert.equal(fix('15OOO'), '15000');
  assert.equal(fix('Ref: 8983B309.'), 'Ref: 89838309.');
  assert.equal(fix('(S00)'), '(500)');
  assert.equal(fix('1l1'), '111');
});

test('fixDigitConfusions : dates, heures, mots normaux, réfs Orange intacts', () => {
  for (const s of [
    '10/06/26', '2026-06-10 09:47:16.', 'le 05/11/26 a 19:33.', 'SOS', 'Bonus', 'Il', 'Il y a SOS Bonus',
    'MP260623.1714.C02389', 'Trans id: MP260623.1714.C02389.', 'edb34e9e', 'Ref: AB123456789.', 'O', 'S', 'B1',
    'Boss', 'Lisbonne', 'solde 0 Ar', 'IOS', 'Olivier', 'Sol1', 'a|2|b', '',
  ]) assert.equal(fix(s), s, s);
  assert.equal(fix(MV), MV);
  assert.equal(fix(OM), OM);
});

test('cleanParty : fin de phrase, 1 lettre, null, nom normal à 2 mots', () => {
  assert.equal(cleanParty('RELIA est reussi'), 'RELIA');
  assert.equal(cleanParty('RELIA est reussi.'), 'RELIA');
  assert.equal(cleanParty('O'), null);
  assert.equal(cleanParty('O est reussi'), null);
  assert.equal(cleanParty(null), null);
  assert.equal(cleanParty(''), null);
  assert.equal(cleanParty('12'), null);
  assert.equal(cleanParty('Rabe Jean'), 'Rabe Jean');
  assert.equal(cleanParty('Nom Prenom'), 'Nom Prenom');
});

test('cleanParty : un nom contenant « Le », « du » n\'est pas amputé', () => {
  assert.equal(cleanParty('Marie Le Gall'), 'Marie Le Gall');
  assert.equal(cleanParty('Epicerie du Coin'), 'Epicerie du Coin');
});

test('cleanParty : « a été effectué » coupe, « a » seul ne coupe pas', () => {
  assert.equal(cleanParty('Rabe a ete effectue'), 'Rabe');
  assert.equal(cleanParty('Rabe a été effectué'), 'Rabe');
  assert.equal(cleanParty('Marie a'), 'Marie a');
});

test('libellé : offre « RELIA est reussi » → note sans fin de phrase', () => {
  const a = parseSms('Votre achat d\'offre Orange RELIA est reussi. Nouveau solde : 8574Ar. 1000Ar', T);
  assert.ok(a.length > 0);
  assert.doesNotMatch(a[0].note, /reussi/);
});
