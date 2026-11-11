const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parseSms, parseSmsScreenshot } = require(`${o}/index.js`);
const fields = require(`${o}/sms/fields.js`);

const T = '2026-11-10';
let blockId = 0;
// Page inventée au format ML Kit : une bulle = liste de BLOCS (écart 1,5 ligne entre blocs d'une
// même bulle), 110 px entre bulles ; { h } = en-tête de jour. Chaque bloc a son numéro de bloc.
const line = (text, top, block, left = 66) => ({ text, left, top, right: 900, bottom: top + 40, block });
function page(items, { banner = true, huawei = false } = {}) {
  const lines = [line('12:57', 40, blockId++, 60), line('OrangeMoney', 160, blockId++, 200)];
  let y = 330;
  for (const it of items) {
    if (it.h) { lines.push(line(it.h, y, blockId++, 300)); y += 110; continue; }
    for (const b of it.blocks) { lines.push(line(b, y, blockId++)); y += 100; }
    if (huawei && !it.notime) { lines.push(line(it.time ?? '10:00', y - 40, blockId++)); y += 60; }
    y += 40;
  }
  if (banner) {
    lines.push(line('L\'expéditeur ne peut pas accepter de réponses.', y, blockId++));
    lines.push(line('Contactez-le directement. En savoir plus', y + 54, blockId++));
  }
  return { width: 1080, height: 2400, lines };
}
const read = (items, opts) => parseSmsScreenshot(page(items, opts), T);

test('a) bulle Orange coupée en blocs (grande police) = 1 ligne, réf et date Trans id', () => {
  const r = read([{ blocks: [
    'Votre transfert de 300 Ar vers le 0320000000 est reussi. Frais: 60 Ar .Nouveau solde:',
    '1200 Ar. Trans id', 'PP261023.1521.D90000.', 'Orange Money vous remercie',
  ] }]);
  assert.equal(r.partial, 0);
  const [main, fee] = r.operations;
  assert.equal(r.operations.length, 2, JSON.stringify(r.operations.map((x) => x.label)));
  assert.equal(main.amount, -30000);
  assert.equal(main.reference, 'PP261023.1521.D90000');
  assert.equal(main.date, '2026-10-23');
  assert.equal(fee.amount, -6000);
});

test('a) transfert en deux blocs, « Trans ld » sans espace après « : »', () => {
  const r = read([{ h: 'mardi 23 juin • 17:16' }, { blocks: [
    'Votre transfert de 20000 AR vers Nom Prenom (03XXXXXXXX) : motif est reussi. Frais: 500 AR.',
    'Votre solde est de 13000 AR. Trans ld: ab12cd3e. Date: 2026-06-10 09:47:16.',
  ] }]);
  assert.equal(r.operations.length, 2);
  assert.equal(r.operations[0].amount, -2000000);
  assert.equal(r.operations[0].reference.toLowerCase(), 'ab12cd3e');
  assert.equal(r.operations[0].date, '2026-06-10');
  assert.ok(r.operations.every((x) => Math.abs(x.amount) !== 1300000));
});

test('fusion abusive : une opération sans réf suivie d\'un autre SMS ne l\'avale pas', () => {
  const open = 'Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau solde: 6574Ar.';
  const next = 'Votre paiement de 500 Ar aupres de BOUTIQUE TEST est reussi. Nouveau solde: 2000 Ar. Trans Id: MP260630.1801.D11111';
  let r = read([{ blocks: [open] }, { blocks: [next] }]);
  assert.equal(r.operations.length, 2, 'deux opérations');
  assert.deepEqual(r.operations.map((x) => x.amount), [-100000, -50000]);
  assert.equal(r.operations[0].reference, null, 'pas de réf volée');
  assert.equal(r.operations[1].reference, 'MP260630.1801.D11111');
  for (const other of ['<#> Votre code est 1234', 'Connexion a votre compte reussie', 'Vous avez recu un transfert de 700 AR venant du 0320000000. Trans Id: MP260630.1802.E22222.']) {
    r = read([{ blocks: [open] }, { blocks: [other] }]);
    const ops = r.operations.filter((x) => Math.abs(x.amount) === 100000);
    assert.equal(ops.length, 1, other);
    assert.equal(ops[0].reference, null, other);
    assert.doesNotMatch(ops[0].label, /<#>|Connexion|700 AR/, other);
  }
  const incoming = read([{ blocks: [open] }, { blocks: ['Vous avez recu un transfert de 700 AR venant du 0320000000. Trans Id: MP260630.1802.E22222.'] }]);
  assert.equal(incoming.operations.length, 2);
});

test('fusion abusive : pub après une opération sans réf = ignorée, aucun faux montant', () => {
  const r = read([{ blocks: ['Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau solde: 6574Ar.'] },
    { blocks: ['Gagnez jusqu\'a 5000 Ar de bonus en partageant ce code'] }]);
  assert.equal(r.operations.length, 1);
  assert.equal(r.operations[0].amount, -100000);
});

test('texte de l\'appli (bandeau) ne s\'ajoute jamais à une opération sans réf', () => {
  const r = read([{ blocks: ['Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau solde: 6574Ar.'] }]);
  assert.equal(r.operations.length, 1);
  assert.doesNotMatch(r.operations[0].label, /exp[ée]diteur|Contactez/i);
});

test('b) bulle Huawei finie et lisible, heure cachée sous la saisie : importée', () => {
  const r = read([
    { blocks: ['Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890'], time: '10:00' },
    { blocks: ['1/2 50 000 Ar envoye a Angelo 0340000002 le 06/11/26 a 12:00. Ref: 1234567891.'] },
    { blocks: ['Texte du message'] },
  ], { huawei: true, banner: false });
  assert.equal(r.partial, 0);
  assert.equal(r.operations.length, 2, JSON.stringify(r.operations.map((x) => x.label)));
  assert.equal(r.operations[1].amount, -5000000);
});

test('b) Huawei : dernière bulle incomplète reste écartée', () => {
  const r = read([
    { blocks: ['Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 1234567890'], time: '10:00' },
    { blocks: ['Retrait reussi: 2 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:50. Frais: 0 Ar. Ref: 12345'] },
  ], { huawei: true, banner: false });
  assert.deepEqual([r.operations.length, r.partial], [1, 1]);
});

const timed = (n) => ({ blocks: [`Retrait reussi: ${n} 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:41. Frais: 0 Ar. Ref: 123456789${n}`] });
const afterTime = (text) => ({ blocks: [text], notime: true });
const HW = { huawei: true, banner: false };

test('b) Huawei : bulle après la dernière heure finie par « Frais: 0 Ar. » sans réf = écartée', () => {
  const cut = afterTime('Retrait reussi: 9 000 Ar aupres de AGENT TEST 0340000001 le 03/10/26 a 19:33. Frais: 0 Ar.');
  for (const items of [[timed(1), timed(2), cut], [timed(1), timed(2), cut, { blocks: ['Texte du message'], notime: true }]]) {
    const r = read(items, HW);
    assert.deepEqual([r.operations.length, r.partial], [2, 1], JSON.stringify(r.operations.map((x) => x.label)));
  }
});

test('b) Huawei : bulle après la dernière heure finie par sa réf (point final toléré) = gardée', () => {
  for (const end of ['Ref: 12345678.', 'Ref: 12345678']) {
    const r = read([timed(1), timed(2), afterTime(`Retrait reussi: 9 000 Ar aupres de AGENT TEST 0340000001 le 03/10/26 a 19:33. Frais: 0 Ar. Solde: 5 000 Ar. ${end}`)], HW);
    assert.deepEqual([r.operations.length, r.partial], [3, 0], end);
    assert.equal(r.operations[2].reference, '12345678', end);
  }
});

test('b) Huawei : bulle suivie de son heure, finie par un point = gardée', () => {
  const sent = { blocks: ['Retrait reussi: 9 000 Ar aupres de AGENT TEST 0340000001 le 03/10/26 a 19:33. Frais: 0 Ar.'] };
  const r = read([timed(1), timed(2), sent], HW);
  assert.deepEqual([r.operations.length, r.partial], [3, 0]);
});

test('d) sans heures (Orange/Google) : règle Huawei inactive, bulle non dernière finie par un point gardée', () => {
  const r = read([
    { blocks: ['Retrait reussi: 9 000 Ar aupres de AGENT TEST 0340000001 le 03/10/26 a 19:33. Frais: 0 Ar.'] },
    { h: 'mardi 23 juin • 17:16' },
    { blocks: ['Retrait reussi: 2 000 Ar aupres de AGENT TEST 0340000001 le 05/11/26 a 11:50. Frais: 0 Ar. Ref: 1234567890'] },
  ], { banner: false });
  assert.deepEqual([r.operations.length, r.partial], [2, 0]);
});

test('endsWithReference / isComplete : bornes', () => {
  const sc = require(`${o}/sms/screenshot.js`);
  assert.equal(sc.endsWithReference('x Ref: 12345678.'), true);
  assert.equal(sc.endsWithReference('x Frais: 0 Ar.'), false);
  assert.equal(sc.endsWithReference('x Ref: ABCDEFGH'), false, 'sans chiffre');
  assert.equal(sc.endsWithReference(''), false);
  assert.equal(sc.isComplete('Frais: 0 Ar.'), true);
  assert.equal(sc.isComplete('Frais: 0 Ar'), false);
});

test('c) réf MVola chiffres coupée par l\'OCR recollée, sans recollage abusif', () => {
  const ref = (s) => fields.referenceOf(s);
  assert.equal(ref('Ref: 89837309 70'), '8983730970');
  assert.equal(ref('Ref: 89837309 70.'), '8983730970', 'point final de la phrase');
  assert.equal(ref('Ref: 89837309 70. Frais: 0 Ar'), '8983730970');
  assert.equal(ref('Ref: 898373 7090'), '8983737090');
  assert.equal(ref('Ref: 1234567 2026-11-05'), '1234567');
  assert.equal(ref('Ref: 1234567 12/11/26'), '1234567');
  assert.equal(ref('Ref: 1234567 12:30'), '1234567');
  assert.equal(ref('Ref: 1234567 5.00'), '1234567');
  assert.equal(ref('Ref: 1234567 5,00'), '1234567');
  assert.equal(ref('Ref: 123456789 12345'), '123456789', 'total > 10 : pas recollé');
  assert.equal(ref('Ref: 12345 67'), null, '5 chiffres : hors règle 6 à 9');
  assert.equal(ref('Trans Id : 03959715. Date : 2026-06-10'), '03959715');
  assert.equal(ref('Trans Id : 03959715 Date : 2026-06-10'), '03959715');
  assert.equal(ref('Ref: AB12345678 12'), 'AB12345678', 'réf alphanumérique jamais recollée');
});

test('c) « envoyea Angelo » normalisé, bulle 1/2 lue', () => {
  const r = parseSms('1/2 50 000 Ar envoyea Angelo 0340000002 le 06/11/26 a 12:00. Ref: 1234567891.', T);
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, -5000000);
  assert.equal(r[0].merchant, 'Angelo');
});

test('c) « Ile » retiré de la contrepartie, mais pas un vrai nom', () => {
  const a = parseSms('Retrait reussi: 1 000 Ar. Transfert envoye a RAKOTO Ile 24/09/26 0340000001. Ref: 1234567890', T);
  assert.equal(a[0].merchant, 'RAKOTO');
  const b = parseSms('Vous avez envoye 1 000 Ar a Ile Maurice 0340000001. Ref: 1234567890', T);
  assert.match(b[0].merchant ?? '', /Maurice/);
  const c = parseSms('Vous avez envoye 1 000 Ar a Ilene Rabe 0340000001. Ref: 1234567890', T);
  assert.match(c[0].merchant ?? '', /^Ilene/);
});

test('c) offre : « Crédit YAS », Orange avec « 500OAr », prime sur la contrepartie', () => {
  const y = parseSms('Achat de credit YAS de 1 000 Ar a 0340000001 reussi. Ref: 1234567890', T)[0];
  assert.equal(y.note, 'Mobile Money · Crédit YAS');
  assert.equal(fields.offerNameOf('Achat de credit TELMA reussi'), 'Crédit TELMA');
  const om = parseSms('Votre achat d\'offre Orange Be connect 1,2Go de 500OAr est reussi. Nouveau solde: 6574Ar. Trans id: MP260623.1714.C02389.', T, null, 'orange-money')[0];
  assert.match(om.note, /· Be connect 1,2Go$/);
  assert.equal(om.amount, -500000, '500OAr = 5000 Ar');
});

test('c) fin de bulle Huawei mal lue : « Solde: 71 200 A. Ref: … » ne devient pas un montant', () => {
  const r = parseSms('Retrait reussi: 1 000 Ar aupres de AGENT TEST 0340000001. Frais: 0 Ar. Solde: 71 200 A. Ref: 1234567890', T);
  assert.equal(r.length, 1);
  assert.equal(r[0].amount, -100000);
  assert.equal(r[0].reference, '1234567890');
});

test('d) bulle Orange coupée en bas (OCR réel) puis bandeau = écartée, partial 1', () => {
  const r = read([{ blocks: ['Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau ude:6574Ar. Trane id MDIANAn 170rE2017 Oranaa'] }]);
  assert.deepEqual([r.operations.length, r.partial], [0, 1]);
  const r2 = read([
    { blocks: ['Votre achat d\'offre Orange Be connect 1,2Go de 5000Ar est reussi. Nouveau solde : 8574Ar. Trans id: MP260623.1714.C02389. Orange Money vous remercie.'] },
    { blocks: ['Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau ude:6574Ar. Trane id MDIANAn 170rE2017 Oranaa'] },
  ]);
  assert.deepEqual([r2.operations.length, r2.partial], [1, 1]);
});

test('deux SMS d\'opération collés (sans réf lue sur le premier) restent séparés', () => {
  const r = read([{ blocks: [
    'Votre achat d\'offre Orange Plus de 1000Ar est reussi. Nouveau solde: 6574Ar. Trans id: MP260623.1714.C02389.',
    'Votre achat d\'offre Orange Plus de 2000Ar est reussi. Nouveau solde: 4574Ar. Trans id: MP260623.1715.C02390.',
  ] }]);
  assert.deepEqual(r.operations.map((x) => x.amount), [-100000, -200000]);
});
