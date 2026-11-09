// pickFlow : état initial selon les paramètres de route, et suite d'un choix de capture.
const test = require('node:test');
const assert = require('node:assert');
const { initialCaptureState, afterPick, parseUris } = require(`${process.env.OCR_OUT}/import/pickFlow.js`);

const ready = (uris = ['a.jpg'], key = 'k', source = 'gallery') => ({ status: 'ready', key, uris, source });

test('initialCaptureState : pick sans uris -> picking', () => {
  assert.deepStrictEqual(initialCaptureState({ pick: 'gallery' }), { status: 'picking', action: 'gallery' });
  assert.deepStrictEqual(initialCaptureState({ pick: 'camera' }), { status: 'picking', action: 'camera' });
});

test('initialCaptureState : partage (uris) -> ready, pick ignoré, clé = uris bruts', () => {
  const raw = JSON.stringify(['x.png', 'y.png']);
  assert.deepStrictEqual(initialCaptureState({ uris: raw, source: 'share' }), { status: 'ready', key: raw, uris: ['x.png', 'y.png'], source: 'share' });
  assert.equal(initialCaptureState({ uris: raw, pick: 'gallery' }).status, 'ready');
});

test('initialCaptureState : pick invalide ou absent -> ready vide, source galerie par défaut', () => {
  for (const p of [{}, { pick: 'nope' }, { pick: '' }]) {
    const s = initialCaptureState(p);
    assert.equal(s.status, 'ready');
    assert.deepStrictEqual(s.uris, []);
    assert.equal(s.source, 'gallery');
  }
});

test('parseUris : JSON invalide, non-tableau, éléments non texte', () => {
  assert.deepStrictEqual(parseUris(undefined), []);
  assert.deepStrictEqual(parseUris(''), []);
  assert.deepStrictEqual(parseUris('{oops'), []);
  assert.deepStrictEqual(parseUris('{"a":1}'), []);
  assert.deepStrictEqual(parseUris('"str"'), []);
  assert.deepStrictEqual(parseUris('["a",1,null,{"u":1},"b"]'), ['a', 'b']);
});

test('afterPick : 1er choix avec captures -> ready, source = action', () => {
  const g = afterPick(null, 'gallery', { uris: ['a', 'b'] }, 1);
  assert.equal(g.state.status, 'ready');
  assert.deepStrictEqual(g.state.uris, ['a', 'b']);
  assert.equal(g.state.source, 'gallery');
  assert.equal(afterPick(null, 'camera', { uris: ['p'] }, 1).state.source, 'camera');
});

test('afterPick : mêmes images, seq différent -> clés différentes (nouvel import)', () => {
  const a = afterPick(null, 'gallery', { uris: ['a'] }, 1).state.key;
  const b = afterPick(ready(['a'], a), 'gallery', { uris: ['a'] }, 2).state.key;
  assert.notEqual(a, b);
  assert.notEqual(a, JSON.stringify(['a']));
});

test('afterPick : annulation au 1er choix -> back', () => {
  assert.deepStrictEqual(afterPick(null, 'gallery', { uris: [] }, 1), { back: true });
  assert.deepStrictEqual(afterPick(null, 'camera', { uris: [] }, 1), { back: true });
});

test('afterPick : caméra refusée / échec au 1er choix -> erreur affichée', () => {
  assert.deepStrictEqual(afterPick(null, 'camera', { denied: true }, 1), { state: { status: 'error', error: 'cameraDenied' } });
  assert.deepStrictEqual(afterPick(null, 'camera', { failed: true }, 1), { state: { status: 'error', error: 'camera' } });
  assert.deepStrictEqual(afterPick(null, 'gallery', { failed: true }, 1), { state: { status: 'error', error: 'pick' } });
});

test('afterPick : « importer d\'autres » annulé/échoué/refusé -> l\'import affiché reste (même objet)', () => {
  const prev = ready();
  for (const r of [{ uris: [] }, { failed: true }, { denied: true }]) {
    const step = afterPick(prev, 'gallery', r, 5);
    assert.ok(!('back' in step));
    assert.strictEqual(step.state, prev);
  }
});

test('afterPick : « importer d\'autres » avec captures -> nouvel état ready', () => {
  const step = afterPick(ready(['a'], 'k1'), 'gallery', { uris: ['c'] }, 2);
  assert.equal(step.state.status, 'ready');
  assert.deepStrictEqual(step.state.uris, ['c']);
  assert.notEqual(step.state.key, 'k1');
});
