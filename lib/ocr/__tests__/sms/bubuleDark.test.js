const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.join(__dirname, '../../../..', p), 'utf8');

test('BubuleSays : teinte du trait et fond de enjoy seulement en sombre, queue par pose', () => {
  const src = read('components/ocr-import/BubuleSays.tsx');
  assert.match(src, /time: \{ tail: 'center', lineArt: true \}/);
  assert.match(src, /enjoy: \{ tail: 'right', lineArt: false \}/);
  assert.match(src, /tintColor=\{isDark && look\.lineArt \? v2\.ink : undefined\}/);
  assert.match(src, /isDark && !look\.lineArt \? \{ backgroundColor: V2\.bgBase, borderRadius: 20 \} : null/);
  assert.match(src, /<SpeechBubbleV2 tail=\{look\.tail\}/);
  // hooks inconditionnels, avant tout return
  assert.ok(src.indexOf('useV2()') < src.indexOf('return ('));
  assert.ok(src.indexOf('useEffectiveColorScheme()') < src.indexOf('return ('));
  // cadrage inchangé
  assert.match(src, /height < 700 \? 0\.45 : 0\.53/);
});

test('CaptureIntroSheet : rangée flex 2 / 3, libellé et handlers conservés', () => {
  const src = read('components/ocr-import/entry/CaptureIntroSheet.tsx');
  assert.doesNotMatch(src, /DialogButtonRow/);
  assert.match(src, /flex: 2 \}\}>\s*<DialogGhostBtn label=\{t\('ocrImport\.intro\.later'\)\} onPress=\{onClose\}/);
  assert.match(src, /flex: 3 \}\}>\s*<DialogPrimaryBtn label=\{continueLabel \?\? t\('ocrImport\.intro\.pick'\)\} onPress=\{onContinue\}/);
});
