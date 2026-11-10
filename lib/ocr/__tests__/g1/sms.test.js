const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { readSmsText, dedupeOperations } = require(`${o}/index.js`);

const T = '2026-11-10';
const MVOLA = 'MVola: Vous avez envoye 25 000 Ar a RAKOTO Jean (0340000000) le 05/11/26 a 14:32. Frais: 400 Ar. Votre solde est de 120 500 Ar. Ref: 1234567890';
const OM = 'Orange Money: Vous avez recu 50 000 Ar de RASOA Marie (0320000000) le 06/11/2026 09:15. Nouveau solde: 75 000 Ar. Trans ID: CI261106.0915.A12345';
const AIRTEL = "Airtel Money: Retrait de 40 000 Ar effectue chez l'agent NAIVO le 07/11/26. Frais 800 Ar. Solde 10 000 Ar. TID: RT261107.1234.B56789";
const MG = "MVola: Nandefa 15 000 Ar tamin'i RABE Hery (0340000001) ianao ny 08/11/26 10:02. Sarany: 200 Ar. Ny volanao: 5 000 Ar. Ref: 998877665";

const sum = (r) => r.operations.map((x) => [x.source, x.date, x.amount, x.kind]);

test('3 SMS séparés par des lignes vides : 3 opérations + frais séparés, soldes ignorés', () => {
  const r = readSmsText([MVOLA, OM, AIRTEL].join('\n\n'), T);
  assert.strictEqual(r.messages, 3);
  assert.strictEqual(r.recognized, 3);
  assert.deepStrictEqual(sum(r), [
    ['mvola', '2026-11-05', -2500000, 'expense'], ['mvola', '2026-11-05', -40000, 'expense'],
    ['orange-money', '2026-11-06', 5000000, 'income'],
    ['airtel-money', '2026-11-07', -4000000, 'expense'], ['airtel-money', '2026-11-07', -80000, 'expense'],
  ]);
  assert.deepStrictEqual(r.operations.map((x) => x.reference), [
    '1234567890', '1234567890-FRAIS', 'CI261106.0915.A12345', 'RT261107.1234.B56789', 'RT261107.1234.B56789-FRAIS',
  ]);
  assert.ok(r.operations.every((x) => x.image === 0));
  assert.ok(!r.operations.some((x) => Math.abs(x.amount) === 12050000 || Math.abs(x.amount) === 7500000));
});

test('SMS collés sans ligne vide, ligne par ligne', () => {
  const r = readSmsText([OM, AIRTEL, MVOLA].join('\n'), T);
  assert.strictEqual(r.messages, 3);
  assert.strictEqual(r.recognized, 3);
});

test('SMS coupé sur plusieurs lignes : reste un seul message', () => {
  const r = readSmsText(MVOLA.replace('. Frais', '\nFrais').replace('. Ref', '\nRef'), T);
  assert.strictEqual(r.messages, 1);
  assert.strictEqual(r.operations.length, 2);
});

test('MVola malgache', () => {
  const r = readSmsText(MG, T);
  assert.deepStrictEqual(sum(r), [['mvola', '2026-11-08', -1500000, 'expense'], ['mvola', '2026-11-08', -20000, 'expense']]);
  assert.strictEqual(r.operations[0].reference, '998877665');
});

test('texte non SMS, vide ou sans montant : aucune opération', () => {
  for (const t of ['Bonjour, on se voit demain a 15h ?', '', '   \n\n ', 'Vous avez recu un message', 'Solde 10 000 Ar']) {
    assert.strictEqual(readSmsText(t, T).operations.length, 0, t);
  }
  const mixed = readSmsText(`Salut !\n\n${OM}`, T);
  assert.strictEqual(mixed.recognized, 1);
  assert.strictEqual(mixed.messages, 2);
});

test('doublon : re-coller le même SMS → référence contre la base', () => {
  const ops = readSmsText(MVOLA, T).operations;
  const existing = [{ id: 'a', type: 'expense', amount: 2500000, date: '2026-11-05', note: null, externalRef: 'mvola:1234567890', isTransfer: false }];
  const r = dedupeOperations(ops, existing);
  assert.strictEqual(r.items[0].duplicate, 'reference');
  assert.notStrictEqual(r.items[1].duplicate, 'reference'); // les frais sont une autre opération
});

test('même SMS collé deux fois dans le lot → fusionné par la référence', () => {
  const ops = readSmsText(`${OM}\n\n${OM}`, T).operations;
  const r = dedupeOperations(ops, []);
  assert.strictEqual(r.items.length, 1);
  assert.strictEqual(r.merged, 1);
});

test('deux achats identiques le même jour sans référence → deux opérations', () => {
  const buy = 'MVola: Vous avez paye 3 000 Ar a BOUTIQUE le 06/11/26 a 10:00.';
  const ops = readSmsText(`${buy}\n\n${buy}`, T).operations;
  assert.strictEqual(ops.length, 2);
  const r = dedupeOperations(ops, []);
  assert.deepStrictEqual(r.items.map((i) => i.duplicate), [null, null]);
});

test('frais : une dépense « Frais » liée, sans date ni référence → champs à vérifier', () => {
  const r = readSmsText('Orange Money: Retrait de 20 000 Ar. Frais: 500 Ar', T);
  assert.strictEqual(r.operations.length, 2);
  assert.strictEqual(r.operations[0].date, T);
  assert.ok(r.operations[0].uncertain.includes('date'));
  assert.ok(r.operations[0].uncertain.includes('reference'));
  assert.strictEqual(r.operations[1].reference, null);
});
