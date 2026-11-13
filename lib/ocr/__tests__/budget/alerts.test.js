const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const o = process.env.OCR_OUT;
const {
  parseBudgetAlerts, alertTier, isAlertVisible, DEFAULT_BUDGET_ALERTS, BUDGET_ALERT_KEYS, SHOW_BUDGET_PROJECTION,
} = require(`${o}/../budget/alerts.js`);

const ROOT = path.resolve(__dirname, '../../../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ALL_ON = { alert50: true, alert80: true, alert100: true };
const ALL_OFF = { alert50: false, alert80: false, alert100: false };

test('défauts = comportement actuel : 50 coupé, 80 et 100 actifs', () => {
  assert.deepStrictEqual(DEFAULT_BUDGET_ALERTS, { alert50: false, alert80: true, alert100: true });
  assert.deepStrictEqual(parseBudgetAlerts({}), DEFAULT_BUDGET_ALERTS);
});

test('clés de réglage', () => {
  assert.deepStrictEqual(BUDGET_ALERT_KEYS, {
    alert50: 'budget_alert_50', alert80: 'budget_alert_80', alert100: 'budget_alert_100',
  });
});

test('parseBudgetAlerts : 1 / 0 lus, valeur invalide ou null -> défaut', () => {
  assert.deepStrictEqual(
    parseBudgetAlerts({ budget_alert_50: '1', budget_alert_80: '0', budget_alert_100: '0' }),
    { alert50: true, alert80: false, alert100: false },
  );
  assert.deepStrictEqual(
    parseBudgetAlerts({ budget_alert_50: 'oui', budget_alert_80: null, budget_alert_100: '' }),
    DEFAULT_BUDGET_ALERTS,
  );
  assert.deepStrictEqual(parseBudgetAlerts({ budget_alert_50: 'true', budget_alert_80: 'true' }), DEFAULT_BUDGET_ALERTS);
});

test('alertTier : bornes 49/50/79/80/100/101', () => {
  assert.strictEqual(alertTier(0), null);
  assert.strictEqual(alertTier(49), null);
  assert.strictEqual(alertTier(50), 'alert50');
  assert.strictEqual(alertTier(79), 'alert50');
  assert.strictEqual(alertTier(80), 'alert80');
  assert.strictEqual(alertTier(100), 'alert80');
  assert.strictEqual(alertTier(101), 'alert100');
  assert.strictEqual(alertTier(5000), 'alert100');
});

test('alertTier : valeurs limites (négatif, NaN) sans alerte', () => {
  assert.strictEqual(alertTier(-10), null);
  assert.strictEqual(alertTier(NaN), null);
});

test('isAlertVisible : chaque interrupteur ne coupe que son palier', () => {
  const cases = [[30, 'none'], [60, 'alert50'], [85, 'alert80'], [100, 'alert80'], [120, 'alert100']];
  for (const [pct, tier] of cases) {
    assert.strictEqual(isAlertVisible(pct, ALL_ON), tier !== 'none', `tout actif ${pct}`);
    assert.strictEqual(isAlertVisible(pct, ALL_OFF), false, `tout coupé ${pct}`);
    if (tier === 'none') continue;
    for (const k of ['alert50', 'alert80', 'alert100']) {
      assert.strictEqual(isAlertVisible(pct, { ...ALL_OFF, [k]: true }), k === tier, `${k} seul à ${pct}`);
      assert.strictEqual(isAlertVisible(pct, { ...ALL_ON, [k]: false }), k !== tier, `${k} coupé à ${pct}`);
    }
  }
});

test('isAlertVisible avec les défauts : 60 % muet, 85 % et 120 % alertent', () => {
  assert.strictEqual(isAlertVisible(60, DEFAULT_BUDGET_ALERTS), false);
  assert.strictEqual(isAlertVisible(85, DEFAULT_BUDGET_ALERTS), true);
  assert.strictEqual(isAlertVisible(120, DEFAULT_BUDGET_ALERTS), true);
});

test('projection de fin de mois masquée (constante), logique conservée dans les composants', () => {
  assert.strictEqual(SHOW_BUDGET_PROJECTION, false);
  for (const f of ['components/dashboard/sections/BudgetsCard.tsx', 'components/activity/BudgetRow.tsx']) {
    const src = read(f);
    assert.match(src, /SHOW_BUDGET_PROJECTION/, f);
    assert.match(src, /willExceed/, `${f} garde la logique`);
    assert.match(src, /budgets\.projected/, f);
  }
});

test('câblage : hydratation aux deux endroits + restauration de sauvegarde + store', () => {
  for (const f of ['contexts/ThemeContext.tsx', 'hooks/useSettings.ts', 'hooks/useBackup.ts']) {
    const src = read(f);
    assert.match(src, /loadBudgetAlerts\(db\)/, f);
    assert.match(src, /initialize\([\s\S]*?(budgetAlerts|loadBudgetAlerts\(db\))\s*\)/, `${f} passe les alertes à initialize`);
  }
  const store = read('stores/settingsStore.ts');
  assert.match(store, /\.\.\.DEFAULT_BUDGET_ALERTS/);
  assert.match(store, /\.\.\.alerts/);
  assert.match(read('hooks/useBudgetAlerts.ts'), /ON CONFLICT\(key\) DO UPDATE/);
});

test('câblage : écrans d\'affichage utilisent les interrupteurs', () => {
  for (const f of [
    'components/dashboard/sections/BudgetsCard.tsx', 'components/activity/BudgetRow.tsx',
    'components/category-detail/CategoryHeroCard.tsx', 'hooks/useBudgetPreview.ts',
  ]) assert.match(read(f), /useBudgetAlertFlags|isAlertVisible|alert80/, f);
  assert.match(read('components/settings/NotificationsSection.tsx'), /setAlert\('alert50'/);
});

test('hygiène : pas de Alert.alert ni de border-left coloré dans les fichiers touchés', () => {
  const files = [
    'app/import/capture.tsx', 'components/ocr-import/review/AccountChip.tsx',
    'components/ocr-import/review/AccountChoiceSheet.tsx', 'components/ocr-import/review/OperationRow.tsx',
    'components/activity/BudgetRow.tsx', 'components/dashboard/sections/BudgetsCard.tsx',
  ];
  for (const f of files) {
    assert.doesNotMatch(read(f), /Alert\.alert/, f);
    assert.doesNotMatch(read(f), /borderLeftWidth\s*:\s*[2-9]/, f);
  }
});

test('i18n : nouvelles clés dans fr, en et mg', () => {
  for (const lang of ['fr', 'en', 'mg']) {
    const j = JSON.parse(read(`lib/i18n/translations/${lang}.json`));
    assert.ok(j.ocrImport.accountSheetTitle, `${lang} accountSheetTitle`);
    assert.match(j.ocrImport.accountChipA11y, /\{\{account\}\}/, `${lang} accountChipA11y`);
  }
});
