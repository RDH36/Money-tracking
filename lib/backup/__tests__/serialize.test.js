// Sauvegarde .mitsitsy : l'avis d'import en attente (peut contenir un e-mail) n'est jamais exporté.
const test = require('node:test');
const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { serializeDatabase } = require(process.env.BACKUP_OUT + '/serialize.js');
const C = require(process.env.BACKUP_OUT + '/constants.js');

const ROOT = process.env.ROOT;
const PENDING = 'import_g1_survey_pending';
const SETTINGS = [
  { key: PENDING, value: JSON.stringify({ email: 'testeur@example.com', comment: 'avis' }) },
  { key: 'plus_license', value: 'lic' },
  { key: 'ocr_reads_2026-11', value: '2' },
  { key: 'ocr_reads_2026-10', value: '3' },
  { key: 'import_feedback_rewarded_at', value: '2026-11-10T10:00:00Z' },
  { key: 'import_g1_first_read_at', value: '2026-11-09T10:00:00Z' },
  { key: 'currency', value: 'MGA' },
  { key: 'app_lock_enabled', value: '1' },
];

function fakeDb(settings) {
  return {
    async getAllAsync(sql) {
      const table = /FROM (\w+)/.exec(sql)[1];
      return table === 'settings' ? settings.map((r) => ({ ...r })) : [{ id: 1, table }];
    },
  };
}

test('export : import_g1_survey_pending absent de settings, aucun e-mail nulle part', async () => {
  const data = await serializeDatabase(fakeDb(SETTINGS));
  assert.ok(!data.settings.some((r) => r.key === PENDING));
  assert.ok(!JSON.stringify(data).includes('testeur@example.com'));
});

test('export : toutes les autres clés de settings restent exportées, intactes et dans l\'ordre', async () => {
  const data = await serializeDatabase(fakeDb(SETTINGS));
  assert.deepStrictEqual(data.settings, SETTINGS.filter((r) => r.key !== PENDING));
  for (const k of ['plus_license', 'ocr_reads_2026-11', 'import_feedback_rewarded_at']) assert.ok(data.settings.some((r) => r.key === k), k);
});

test('export : les autres tables sont inchangées, même une ligne dont la clé vaut la clé exclue', async () => {
  const data = await serializeDatabase(fakeDb(SETTINGS));
  for (const t of C.BACKUP_TABLES) if (t !== 'settings') assert.deepStrictEqual(data[t], [{ id: 1, table: t }]);
  const db = { async getAllAsync(sql) { return /FROM settings/.test(sql) ? [] : [{ key: PENDING }]; } };
  const d2 = await serializeDatabase(db);
  assert.deepStrictEqual(d2.settings, []);
  const other = C.BACKUP_TABLES.find((t) => t !== 'settings');
  assert.deepStrictEqual(d2[other], [{ key: PENDING }]);
});

test('export : settings vide ou clé numérique/absente ne plante pas', async () => {
  assert.deepStrictEqual((await serializeDatabase(fakeDb([]))).settings, []);
  const d = await serializeDatabase(fakeDb([{ key: 7, value: 'x' }, { value: 'y' }]));
  assert.strictEqual(d.settings.length, 2);
});

test('constantes : EXPORT_SKIPPED_SETTING_KEYS = [pending] ; EXCLUDED_SETTING_KEYS (import) inchangé', () => {
  assert.deepStrictEqual(C.EXPORT_SKIPPED_SETTING_KEYS, [PENDING]);
  assert.deepStrictEqual(C.EXCLUDED_SETTING_KEYS, ['app_lock_enabled', 'app_lock_biometric', 'backup_dir_uri']);
  const des = readFileSync(join(ROOT, 'lib/backup/deserialize.ts'), 'utf8');
  assert.doesNotMatch(des, /EXPORT_SKIPPED_SETTING_KEYS/);
});
