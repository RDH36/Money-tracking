const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '../../../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('BubuleSays : aucun fond en sombre, variante d image pour enjoy, trait teinté pour time', () => {
  const src = read('components/ocr-import/BubuleSays.tsx');
  assert.match(src, /time: \{ tail: 'center', darkSource: null \}/);
  assert.match(src, /enjoy: \{ tail: 'right', darkSource: require\('@\/assets\/images\/bubule-enjoy-dark\.png'\) \}/);
  assert.match(src, /source=\{isDark && look\.darkSource \? look\.darkSource : p\.source\}/);
  assert.match(src, /tintColor=\{isDark && !look\.darkSource \? v2\.ink : undefined\}/);
  // plus aucun fond ni couleur en dur derrière Bubule
  assert.doesNotMatch(src, /backgroundColor|backdrop|borderRadius|V2\.bgBase|#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  assert.doesNotMatch(src, /import \{[^}]*\bV2\b[^}]*\} from/);
  assert.match(src, /<SpeechBubbleV2 tail=\{look\.tail\}/);
  // hooks inconditionnels, avant tout return
  assert.ok(src.indexOf('useV2()') < src.indexOf('return ('));
  assert.ok(src.indexOf('useEffectiveColorScheme()') < src.indexOf('return ('));
  // cadrage inchangé
  assert.match(src, /height < 700 \? 0\.45 : 0\.53/);
  assert.match(src, /time: \{ source: require\('@\/assets\/images\/bubule-time\.png'\)/);
  assert.match(src, /enjoy: \{ source: require\('@\/assets\/images\/bubule-enjoy\.png'\), width: 400, height: 300, left: -128, top: -30 \}/);
});

test('asset bubule-enjoy-dark.png : 661x377, fond transparent, bbox de l original, original intact', () => {
  const py = [
    'import sys, hashlib',
    'from PIL import Image',
    'a = Image.open(sys.argv[1]).convert("RGBA"); o = Image.open(sys.argv[2]).convert("RGBA")',
    'al = a.getchannel("A")',
    'print(a.size[0], a.size[1], al.getpixel((0,0)), al.getpixel((a.width-1,a.height-1)), al.getbbox() == o.getchannel("A").getbbox(), sum(1 for v in al.getdata() if v > 20) > 1000)',
  ].join('\n');
  const dark = path.join(root, 'assets/images/bubule-enjoy-dark.png');
  const orig = path.join(root, 'assets/images/bubule-enjoy.png');
  assert.ok(fs.existsSync(dark));
  const out = execFileSync('python3', ['-I', '-c', py, dark, orig]).toString().trim();
  assert.strictEqual(out, '661 377 0 0 True True');
});
