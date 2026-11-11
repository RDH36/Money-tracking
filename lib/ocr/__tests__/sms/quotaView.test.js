const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// bbox du personnage mesuré sur bubule-time.png (661x377) : x 286-370, y 35-326.
const BBOX = { x0: 286, y0: 35, x1: 370, y1: 326 };

test('le cadrage de Bubule contient tout le personnage aux deux échelles', () => {
  const src = read('components/ocr-import/states/QuotaBlockedView.tsx');
  assert.match(src, /height < 700 \? 0\.45 : 0\.53/);
  assert.match(src, /left: -228 \* s, top: -30 \* s, width: 661 \* s, height: 377 \* s/);
  assert.match(src, /width: 200 \* s, height: 300 \* s, overflow: 'hidden'/);
  const [left, top, w, h] = [228, 30, 200, 300];
  assert.ok(BBOX.x0 >= left && BBOX.x1 <= left + w);
  assert.ok(BBOX.y0 >= top && BBOX.y1 <= top + h);
});

test('clé ocrImport.limit.bubble présente en fr et en', () => {
  for (const l of ['fr', 'en']) {
    const j = JSON.parse(read(`lib/i18n/translations/${l}.json`));
    assert.ok(j.ocrImport.limit.bubble.length > 0, l);
  }
});

test('SettingsHeader : 1 ligne par défaut, 2 pour l\'import', () => {
  assert.match(read('components/settings/v2/SettingsHeader.tsx'), /titleLines = 1/);
  assert.match(read('components/ocr-import/states/CaptureFrame.tsx'), /titleLines=\{2\}/);
  assert.match(read('components/ocr-import/states/QuotaBlockedView.tsx'), /titleLines=\{2\}/);
});
