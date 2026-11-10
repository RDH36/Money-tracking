const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parseSms, parseSmsScreenshot } = require(`${o}/index.js`);
const { categoryHintFor } = require(`${o}/mcb/classify.js`);

// Messagerie Huawei inventée (720 px) : heure seule SOUS chaque bulle, en-têtes centrés.
const mk = (text, top, left = 40) => ({ text, left, top, right: left + 500, bottom: top + 34 });
function huawei(items) {
  const lines = [];
  let y = 20;
  const add = (t, l) => { lines.push(mk(t, y, l)); y += 46; };
  add('14:41', 30); add('MVola', 200); y += 40;
  for (const it of items) {
    if (it.h) add(it.h, 260);
    else {
      for (const r of it.rows) add(r);
      if (it.time) add(it.time);
    }
    y += 40;
  }
  return { width: 720, height: 1560, lines };
}
const parse = (items) => parseSmsScreenshot(huawei(items), '2026-11-10').operations;
const T = '2026-11-10';

test('Huawei : en-tête « mardi Aujourd\'hui » = date du jour, « jeudi Hier » = veille', () => {
  const ops = parse([
    { h: 'jeudi Hier' }, { rows: ['Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001', 'le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890'], time: '10:00' },
    { h: 'mardi Aujourd\'hui' }, { rows: ['L achat de votre offre NET MONTH 15 000 avec', 'MVola est reussi. Vous avez 3200Mo utilisable a', 'toute heure.'], time: '11:00' },
  ]);
  const offer = ops.find((x) => x.amount === -1500000);
  assert.ok(offer, 'offre 15 000 lue');
  assert.equal(offer.date, T);
  assert.equal(offer.kind, 'expense');
});

test('Huawei : une ligne juste par bulle, solde / pubs / échecs ignorés', () => {
  const ops = parse([
    { h: 'lundi 2 novembre' },
    { rows: ['Achat de credit YAS reussi: 500 Ar. Bonus: 20', 'pourcent sur ce dernier rechargement. Solde MVola :', '2 345 Ar. Ref: 1000000001'], time: '07:46' },
    { rows: ['Votre solde MVola est insuffisant. Votre solde est de 1 000 Ar. Ref: 1234567'], time: '07:50' },
    { rows: ['Le 29/10/26 a 14:03, solde MVola : 32 948. Rechargez', 'et gagnez un bonus. Ref: 1234567890'], time: '07:51' },
    { rows: ['Bravo! MVola vous offre 90 j de validité', 'pour continuer à gagner ce bonus, gardez de l\'argent'], time: '07:52' },
    { rows: ['2/2 Astuce : +20% de BONUS offerts sur vos credits'], time: '07:53' },
    { rows: ['2/2 Les depots MVola sont toujours GRATUITS 5 000 Ar'], time: '07:54' },
    { rows: ['30 000 Ar reçu de BANQUE TEST JEAN DUPONT le 03/10/26 a 19:33.', 'Frais: 0 Ar. Raison: test. Solde: 40 000 Ar. Ref: 2000000002'], time: '07:55' },
  ]);
  assert.equal(ops.length, 2, JSON.stringify(ops.map((x) => x.label)));
  assert.deepEqual([ops[0].amount, ops[0].kind, ops[0].date, ops[0].reference], [-50000, 'expense', '2026-11-02', '1000000001']);
  assert.deepEqual([ops[1].amount, ops[1].kind, ops[1].date, ops[1].reference], [3000000, 'income', '2026-10-03', '2000000002']);
});

test('Huawei : bulle coupée en bas (après la dernière heure) ignorée, bulle partielle du haut aussi', () => {
  const ops = parse([
    { rows: ['Solde: 20 750 Ar. Ref: 1111111111'], time: '19:19' },
    { h: 'lundi 2 novembre' },
    { rows: ['Retrait reussi: 2 000 Ar aupres de AGENT TEST 0340000001 le 22/09/26 a 11:41.', 'Frais: 0 Ar. Solde : 1 Ar. Ref: 4000000004.'], time: '07:46' },
    { rows: ['Achat de credit YAS reussi: 5 000 Ar pour'] },
    { rows: ['Texte du message'] },
  ]);
  assert.equal(ops.length, 1, JSON.stringify(ops.map((x) => x.label)));
  assert.equal(ops[0].amount, -200000);
});

test('Huawei : montant coupé en deux mots par l\'OCR (« 15 » « 000 ») reste 15 000', () => {
  const ops = parse([
    { h: 'mardi Aujourd\'hui' },
    { rows: ['L achat de votre offre NET MONTH 15', '000 avec MVola est reussi. Vous avez 3200Mo.'], time: '11:00' },
    { rows: ['Retrait reussi: 1 000 Ar aupres de A 0340000001 Ref: 1234567890'], time: '11:01' },
  ]);
  assert.equal(ops[0].amount, -1500000);
});

test('parseSms MVola : formes réelles', () => {
  const one = (s) => parseSms(s, T);
  let r = one('Achat de credit Telma reussi: 1 000 Ar pour 0340000000. Frais: 100 Ar. Bonus: 20 pourcent. Solde MVola: 2 000 Ar. Ref: 6666666666');
  assert.deepEqual(r.map((x) => x.amount), [-100000, -10000]);
  r = one('Vous avez reçu 9 999 Ar depuis votre compte BANQUE COURANT le 01/10/26 10:00. Frais : 0 AR. Votre solde MVola est de 19 999 AR. Ref 5555555555');
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].amount, r[0].kind, r[0].date], [999900, 'income', '2026-10-01']);
  r = one('1/2 50 000 Ar envoye a paul 0340000000 le 24/09/26 a 19:18.Raison: x. Solde: 20 700 Ar. Ref: 3000000003.');
  assert.deepEqual([r[0].amount, r[0].date, r[0].reference], [-5000000, '2026-09-24', '3000000003']);
  r = one('Merci d avoir choisi MORA 500 Votre offre sera automatiquement renouvelee a minuit.');
  assert.deepEqual([r.length, r[0].amount, r[0].kind], [1, -50000, 'expense']);
  assert.equal(one('Le 29/10/26 a 14:03, solde MVola : 32 948. Rechargez et gagnez un bonus. Ref: 1234567890').length, 0);
});

test('aucun Solde pris pour un montant', () => {
  for (const s of ['Votre solde MVola est de 5 000 Ar. Ref: 1234567', 'Solde MVola : 32 948. Ref: 1234567890']) assert.equal(parseSms(s, T).length, 0, s);
});

test('faux positifs offerPrice : offre sans prix, « de 1000Ar » Orange, durée', () => {
  assert.equal(parseSms('Bravo! MVola vous offre 90 j de validité supplémentaire', T).length, 0);
  assert.equal(parseSms('Vous avez 3200Mo utilisable. Consultez l\'offre NET 3200 Mo', T).length, 0);
  const r = parseSms('Votre achat d\'offre Orange Akama Plus de 1000Ar est reussi. Nouveau solde : 6574Ar. Trans id: MP260630.1726.C00000.', T);
  assert.deepEqual(r.map((x) => x.amount), [-100000]);
});

test('PROMO + reussi : une pub sans opération ne doit pas passer', () => {
  for (const s of [
    'Inscription reussie! Gagnez un bonus de 5 000 Ar en parrainant un ami. Ref: 1234567890',
    'Rechargement reussi? Non! Partagez et gagnez jusqu a 10 000 Ar de bonus.',
  ]) assert.equal(parseSms(s, T).length, 0, s);
});

test('Orange Money sans heure sous bulle : tout est gardé (barre d\'état seule ne compte pas)', () => {
  const lines = [mk('12:57', 20), mk('OrangeMoney', 100), mk('mardi 30 juin', 200, 200)];
  let y = 260;
  for (const t of ['Votre paiement de 500 Ar aupres de BOUTIQUE est reussi. Frais: 0 Ar. Trans Id: MP260630.1801.D11111',
    'Vous avez reçu un transfert de 5000 AR venant du 0320000000 : test. Trans Id : MP260629.0915.E22222']) { lines.push(mk(t, y)); y += 120; }
  const ops = parseSmsScreenshot({ width: 720, height: 1560, lines }, T).operations;
  assert.equal(ops.length, 2);
});

test('catégorie yas = bills', () => {
  assert.equal(categoryHintFor('Achat de credit YAS reussi'), 'bills');
});
