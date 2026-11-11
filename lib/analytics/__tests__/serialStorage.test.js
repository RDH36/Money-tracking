const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const OUT = process.env.SERIAL_OUT;
const { createSerialStorage } = require(path.join(OUT, 'serialStorage.js'));

const tick = () => new Promise((r) => setImmediate(r));

// Faux disque partage entre "demarrages" : imite l'ecriture native
// (si absent -> point d'attente -> creer, "already exists" si entre-temps present).
function makeDisk(initial = {}) {
  const files = new Map(Object.entries(initial));
  const log = { maxParallel: 0, parallel: 0 };
  const open = (key) => ({
    async text() {
      if (!files.has(key)) throw new Error('file does not exist');
      return files.get(key);
    },
    async write(content) {
      log.parallel++;
      log.maxParallel = Math.max(log.maxParallel, log.parallel);
      try {
        const existedAtStart = files.has(key);
        await tick();
        if (!existedAtStart && files.has(key)) throw new Error('Unable to create file or directory: it already exists');
        files.set(key, content);
      } finally {
        log.parallel--;
      }
    },
  });
  return { files, open, log };
}

const KEY = '.posthog-rn.json';

test('temoin : sans file, la rafale de premier lancement echoue', async () => {
  const { open } = makeDisk();
  const results = await Promise.allSettled([1, 2, 3].map((n) => open(KEY).write(String(n))));
  assert.ok(results.some((r) => r.status === 'rejected'));
});

test('file : rafale de setItem sur fichier absent, aucun echec, derniere valeur gagne', async () => {
  const { open, files, log } = makeDisk();
  const s = createSerialStorage(open);
  const results = await Promise.allSettled(['a', 'b', 'c', 'd'].map((v) => s.setItem(KEY, v)));
  assert.deepEqual(results.map((r) => r.status), ['fulfilled', 'fulfilled', 'fulfilled', 'fulfilled']);
  assert.equal(files.get(KEY), 'd');
  assert.equal(log.maxParallel, 1);
});

test('second demarrage : getItem relit, setItem reussit', async () => {
  const disk = makeDisk();
  await createSerialStorage(disk.open).setItem(KEY, '{"v":1}');
  const s2 = createSerialStorage(disk.open);
  assert.equal(await s2.getItem(KEY), '{"v":1}');
  await Promise.all([s2.setItem(KEY, '{"v":2}'), s2.setItem(KEY, '{"v":3}')]);
  assert.equal(await s2.getItem(KEY), '{"v":3}');
});

test('une ecriture en echec est rejetee a l appelant et ne bloque pas les suivantes', async () => {
  let n = 0;
  const written = [];
  const open = () => ({
    text: async () => '',
    write: async (c) => {
      n++;
      if (n === 1) throw new Error('boom');
      written.push(c);
    },
  });
  const s = createSerialStorage(open);
  const p1 = s.setItem(KEY, 'x');
  const p2 = s.setItem(KEY, 'y');
  await assert.rejects(p1, /boom/);
  await p2;
  await s.setItem(KEY, 'z');
  assert.deepEqual(written, ['y', 'z']);
});

test('getItem : null si fichier absent ou lecture impossible', async () => {
  const s = createSerialStorage(makeDisk().open);
  assert.equal(await s.getItem(KEY), null);
  const throwsSync = createSerialStorage(() => {
    throw new Error('open failed');
  });
  assert.equal(await throwsSync.getItem(KEY), null);
});

test('cles independantes : pas de file commune entre fichiers', async () => {
  const disk = makeDisk();
  const s = createSerialStorage(disk.open);
  await Promise.all([s.setItem('a', '1'), s.setItem('b', '2')]);
  assert.equal(disk.files.get('a'), '1');
  assert.equal(disk.files.get('b'), '2');
});

test('aucun unhandledRejection quand une ecriture echoue (rejet gere par l appelant)', async () => {
  const seen = [];
  const h = (e) => seen.push(e);
  process.on('unhandledRejection', h);
  try {
    const s = createSerialStorage(() => ({ text: async () => '', write: async () => { throw new Error('nope'); } }));
    await s.setItem(KEY, 'x').catch(() => undefined);
    await s.setItem(KEY, 'y').catch(() => undefined);
    await tick();
    await tick();
  } finally {
    process.off('unhandledRejection', h);
  }
  assert.equal(seen.length, 0);
});

test('lib/posthog.ts garde le fichier de la lib (Paths.document + cle de la lib)', () => {
  const src = fs.readFileSync(path.join(process.env.ROOT, 'lib/posthog.ts'), 'utf8');
  assert.match(src, /new File\(Paths\.document, key\)/);
  assert.match(src, /customStorage,/);
  assert.doesNotMatch(src, /LogBox\.ignore/);
});
