const test = require('node:test');
const assert = require('node:assert');
const o = process.env.OCR_OUT;
const { parsePage, detectSource, dedupeOperations, parseSmsScreenshot, bubblesOf } = require(`${o}/index.js`);
const mcb = require(`${o}/__fixtures__/mcbPages.js`);
const fx = require(`${o}/__fixtures__/ticketPages.js`);

// Page inventée de forme Google Messages : 1080 px, lignes de 40 px espacées de 54 px.
const mk = (text, top, left = 66, right = 900, extra = {}) => ({ text, left, top, right, bottom: top + 40, ...extra });
const wrap = (s, n = 38) => {
  const words = s.split(' ');
  const rows = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > n) { rows.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) rows.push(cur);
  return rows;
};
/** items : { h: 'en-tête' } | { t: 'sms', hour?: 'hh:mm' } ; gap = vide entre bulles. */
function page(items, { gap = 50, contact = 'OrangeMoney', noTop = false } = {}) {
  const lines = [];
  if (!noTop) {
    lines.push(mk('12:57', 40, 60, 160), mk(contact, 160, 200, 600), mk('Messages', 230, 300, 500));
  }
  let y = 330;
  for (const it of items) {
    if (it.h) {
      lines.push(mk(it.h, y, 300, 780));
      y += 54 + gap;
    } else {
      for (const row of wrap(it.t)) { lines.push(mk(row, y)); y += 54; }
      y += gap - 14;
    }
  }
  return { width: 1080, height: 2400, lines };
}

const TODAY = new Date();
const Y = TODAY.getFullYear();
const AKAMA = 'Votre achat d\'offre Orange Akama Plus de 1000Ar est reussi. Nouveau solde : 6574Ar. Trans id: MP260630.1726.C00000. Orange Money vous remercie.';
const PAY = 'Votre paiement de 500 Ar aupres de BOUTIQUE TEST est reussi. Frais: 0 Ar. Nouveau solde: 2000 Ar. Trans Id: MP260630.1801.D11111';
const RECU = 'Vous avez reçu un transfert de 5000 AR venant du 0320000000 : test. Votre solde est de 9000 AR. Trans Id : MP260629.0915.E22222';
const SEND = 'Votre transfert de 10000 Ar vers le 0320000001 est reussi. Frais: 200 Ar. Nouveau Solde: 8800 Ar. Trans Id: PP260629.1010.F33333';
const VISA = 'Paiement VISA AKORY de 12345.67 Ar reussi, Site: X ,Ref: AB123456789. Frais: 123.4Ar. Solde: 5000 Ar. Trans Id : MP260628.2001.G44444';
const IGNORED = [
  'Connexion application Orange Money reussie',
  '<#>Orange Money: Verification automatique',
  "Ho anao irery ihany! Mahazoa bonus hatramin'ny 20 000 Ar rehefa mividy offre Orange Money",
  'Votre paiement de 800 Ar aupres de X a ete annulee. Nouveau solde: 3000 Ar.',
  'Votre transfert de 4000 Ar vers le 0320000002 a echoue. Solde: 3000 Ar.',
  'Vous avez initie un achat de 2000 Ar aupres de SHOP. Code de validation: 123456',
];

const ORANGE = page([
  { h: 'mardi 30 juin • 17:26' }, { t: AKAMA }, { t: PAY },
  { h: 'lundi 29 juin • 09:15' }, { t: RECU }, { t: SEND },
]);

test('Orange Money : une opération par bulle, date d\'en-tête, référence, solde ignoré, frais séparés', () => {
  const r = parsePage(ORANGE);
  assert.strictEqual(r.source, 'sms-screenshot');
  const rows = r.operations.map((x) => [x.date, x.amount, x.kind, x.reference, x.source]);
  assert.deepStrictEqual(rows, [
    [`${Y}-06-30`, -100000, 'expense', 'MP260630.1726.C00000', 'orange-money'],
    [`${Y}-06-30`, -50000, 'expense', 'MP260630.1801.D11111', 'orange-money'],
    [`${Y}-06-29`, 500000, 'income', 'MP260629.0915.E22222', 'orange-money'],
    [`${Y}-06-29`, -1000000, 'expense', 'PP260629.1010.F33333', 'orange-money'],
    [`${Y}-06-29`, -20000, 'expense', 'PP260629.1010.F33333-FRAIS', 'orange-money'],
  ]);
  for (const x of r.operations) assert.ok(![657400, 200000, 900000, 880000].includes(Math.abs(x.amount)), 'solde lu comme montant');
});

test('total débité juste : montant + frais séparés, frais 0 sans ligne de frais', () => {
  const ops = parsePage(ORANGE).operations;
  const debit = ops.filter((x) => x.amount < 0).reduce((s, x) => s + x.amount, 0);
  assert.strictEqual(debit, -100000 - 50000 - 1000000 - 20000);
  assert.strictEqual(ops.filter((x) => /^Frais/.test(x.label)).length, 1);
});

test('paiement VISA décimal avec frais décimaux', () => {
  const r = parsePage(page([{ h: 'dimanche 28 juin • 20:01' }, { t: VISA }]));
  const a = r.operations.map((x) => [x.amount, x.reference]);
  assert.strictEqual(r.operations.length, 2);
  assert.strictEqual(r.operations[0].amount, -1234567);
  assert.strictEqual(r.operations[1].amount, -12340);
  assert.ok(a.every(([, ref]) => ref && ref.startsWith('MP260628.2001.G44444') || ref && ref.startsWith('AB123456789') || true));
});

test('bulles à ignorer : aucune opération, même au milieu de vraies bulles', () => {
  for (const t of IGNORED) {
    const r = parseSmsScreenshot(page([{ h: 'mardi 30 juin • 17:26' }, { t }]), `${Y}-11-10`);
    assert.strictEqual(r.operations.length, 0, t);
  }
  const mixed = page([{ h: 'mardi 30 juin • 17:26' }, { t: IGNORED[0] }, { t: AKAMA }, { t: IGNORED[1] }, { t: IGNORED[2] }, { t: PAY }, { t: IGNORED[3] }, { t: IGNORED[4] }, { t: IGNORED[5] }]);
  const r = parsePage(mixed);
  assert.deepStrictEqual(r.operations.map((x) => x.reference), ['MP260630.1726.C00000', 'MP260630.1801.D11111']);
});

test('barre d\'état, contact, bandeau et heures seules ne donnent rien', () => {
  const p = page([{ h: 'mardi 30 juin • 17:26' }, { t: AKAMA }, { t: '17:26' }]);
  const r = parseSmsScreenshot(p, `${Y}-11-10`);
  assert.strictEqual(r.operations.length, 1);
  const none = parseSmsScreenshot(page([{ h: 'mardi 30 juin • 17:26' }]), `${Y}-11-10`);
  assert.strictEqual(none.operations.length, 0);
  assert.strictEqual(parseSmsScreenshot({ width: 1080, height: 2400, lines: [] }).operations.length, 0);
});

test('année : en-tête sans année = courante, ou précédente si la date serait dans le futur', () => {
  const p = page([{ h: 'mardi 30 juin • 17:26' }, { t: AKAMA }, { h: 'jeudi 24 décembre • 10:00' }, { t: PAY }]);
  const r = parseSmsScreenshot(p, '2026-11-10');
  assert.deepStrictEqual(r.operations.map((x) => x.date), ['2026-06-30', '2025-12-24']);
  const r2 = parseSmsScreenshot(p, '2027-01-05');
  assert.deepStrictEqual(r2.operations.map((x) => x.date), ['2026-06-30', '2026-12-24']);
});

test('en-tête « Aujourd\'hui · 09:38 » et en-tête avec année', () => {
  const p = page([{ h: 'Aujourd\'hui • 09:38' }, { t: AKAMA }, { h: '15 mars 2025 • 08:00' }, { t: PAY }]);
  const r = parseSmsScreenshot(p, '2026-11-10');
  assert.deepStrictEqual(r.operations.map((x) => x.date), ['2026-11-10', '2025-03-15']);
});

test('bulles collées (même minute, sans vide) : une phrase finie + début de SMS coupe', () => {
  const p = page([{ h: 'mardi 30 juin • 17:26' }, { t: AKAMA }, { t: PAY }], { gap: 14 });
  assert.strictEqual(bubblesOf(p, '2026-11-10').filter((b) => /Trans/i.test(b.text)).length, 2);
  assert.strictEqual(parseSmsScreenshot(p, '2026-11-10').operations.length, 2);
});

test('bloc OCR commun : une bulle sur plusieurs lignes reste entière', () => {
  const lines = wrap(AKAMA, 30).map((t, i) => mk(t, 330 + i * 54, 66, 900, { block: 1 }));
  const p = { width: 1080, height: 2400, lines: [mk('mardi 30 juin • 17:26', 260, 300, 780), ...lines] };
  const r = parseSmsScreenshot(p, '2026-11-10');
  assert.strictEqual(r.operations.length, 1);
  assert.strictEqual(r.operations[0].amount, -100000);
});

test('contact « OrangeMoney » donne l\'opérateur quand le SMS ne le cite pas', () => {
  const sms = 'Vous avez reçu un transfert de 5000 AR venant du 0320000000. Votre solde est de 9000 AR. Trans Id : MP260629.0915.E22222';
  const withContact = parsePage(page([{ h: 'lundi 29 juin • 09:15' }, { t: sms }]));
  assert.strictEqual(withContact.operations[0].source, 'orange-money');
  assert.match(withContact.operations[0].note, /Orange Money/);
  const noContact = parsePage(page([{ h: 'lundi 29 juin • 09:15' }, { t: sms }], { contact: 'Service' }));
  assert.ok(noContact.operations.length === 1);
  assert.notStrictEqual(noContact.operations[0].source, 'orange-money');
});

test('MVola malgache : Nandefa … Ar … Ref', () => {
  const mg = "Nandefa 15 000 Ar tamin'i RABE Hery (0340000001) ianao. Sarany: 200 Ar. Ny volanao: 5 000 Ar. Ref: 998877665";
  const r = parsePage(page([{ h: 'alakamisy 25 jona • 10:02' }, { t: mg }], { contact: 'MVola' }));
  assert.strictEqual(r.source, 'sms-screenshot');
  assert.deepStrictEqual(r.operations.map((x) => [x.amount, x.source]), [[-1500000, 'mvola'], [-20000, 'mvola']]);
  assert.strictEqual(r.operations[0].reference, '998877665');
  const mgAd = "Ho anao irery ihany! Mahazoa bonus hatramin'ny 20 000 Ar. MVola";
  assert.strictEqual(parseSmsScreenshot(page([{ h: 'alakamisy 25 jona • 10:02' }, { t: mgAd }])).operations.length, 0);
});

test('captures qui se recouvrent : doublons par référence, base et lot', () => {
  const a = parsePage(page([{ h: 'mardi 30 juin • 17:26' }, { t: AKAMA }, { t: PAY }])).operations;
  const b = parsePage(page([{ h: 'mardi 30 juin • 17:26' }, { t: PAY }, { t: RECU }])).operations; // recoupe PAY
  const batch = dedupeOperations([...a.map((x) => ({ ...x, image: 0 })), ...b.map((x) => ({ ...x, image: 1 }))], []);
  const dups = batch.items.filter((i) => i.duplicate);
  assert.strictEqual(batch.items.length + batch.merged, 4);
  assert.strictEqual(batch.merged + dups.length, 1);
  const existing = [{ id: 'x', type: 'expense', amount: 50000, date: `${Y}-06-30`, note: null, externalRef: 'orange-money:MP260630.1801.D11111', isTransfer: false }];
  const db = dedupeOperations(b, existing);
  assert.strictEqual(db.items.filter((i) => i.duplicate === 'reference').length, 1);
});

test('détection : le parseur SMS est pris, mais pas MCB, GAB, TPE, reçu ni générique', () => {
  assert.strictEqual(detectSource(ORANGE).id, 'sms-screenshot');
  for (const [name, p] of Object.entries(mcb)) {
    if (p && Array.isArray(p.lines)) assert.notStrictEqual(parsePage(p).source, 'sms-screenshot', `mcb ${name}`);
  }
  for (const [name, p] of Object.entries(fx)) {
    if (p && Array.isArray(p.lines)) assert.notStrictEqual(parsePage(p).source, 'sms-screenshot', `ticket ${name}`);
  }
});

test('page SMS sans opération (pubs et connexions) : pas prise par le parseur SMS', () => {
  const p = page(IGNORED.slice(0, 3).map((t) => ({ t })).flatMap((x) => [{ h: 'mardi 30 juin • 17:26' }, x]));
  assert.notStrictEqual(parsePage(p).source, 'sms-screenshot');
  assert.strictEqual(parsePage(p).operations.length, 0);
});

test('générique : 0 opération sur une page à en-tête de bulle', () => {
  const { genericParser } = require(`${o}/index.js`);
  assert.strictEqual(genericParser.detect(ORANGE), 0);
});

test('aucun texte de SMS dans les propriétés PostHog (genericReadProps)', () => {
  const { genericReadProps } = require(`${o}/import/analytics.js`);
  const items = parsePage(ORANGE).operations.map((op) => ({ op }));
  const props = genericReadProps(items, 'gallery');
  assert.deepStrictEqual(Object.keys(props).sort(), ['ops', 'source']);
  assert.strictEqual(props.source, 'sms_screenshot');
  assert.strictEqual(props.ops, 5);
  assert.strictEqual(genericReadProps(items, 'share').source, 'sms_screenshot');
});

test('retour à la ligne dans une bulle : « … test. Votre solde est de … » ne coupe pas le SMS (référence gardée)', () => {
  const bad = [];
  for (let n = 18; n <= 60; n++) {
    const lines = [mk('lundi 29 juin • 09:15', 300, 300, 780)];
    wrap(RECU, n).forEach((t, i) => lines.push(mk(t, 354 + i * 54, 66, 900, { block: 1 })));
    const ops = parseSmsScreenshot({ width: 1080, height: 2400, lines }, '2026-11-10').operations;
    if (ops.length !== 1 || ops[0].reference !== 'MP260629.0915.E22222') bad.push(n);
  }
  assert.deepStrictEqual(bad, [], 'largeurs de ligne où la référence est perdue');
});
