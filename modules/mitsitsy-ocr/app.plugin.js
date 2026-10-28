/**
 * Config plugin: makes Mitsitsy an Android share target for images
 * (one or several screenshots).
 *
 * `shareTarget: 'debug'` (default) writes the intent filters to the DEBUG
 * manifest only, so the share entry exists exactly when OCR_IMPORT_ENABLED
 * (= __DEV__) is on. Switch to 'all' when the feature ships to production.
 */
const path = require('path');
const fs = require('fs');
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');

const SHARE_ACTIONS = ['android.intent.action.SEND', 'android.intent.action.SEND_MULTIPLE'];

function shareFilters() {
  return SHARE_ACTIONS.map((action) => ({
    action: [{ $: { 'android:name': action } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    data: [{ $: { 'android:mimeType': 'image/*' } }],
  }));
}

function hasShareFilter(activity) {
  return (activity['intent-filter'] || []).some((filter) =>
    (filter.action || []).some((a) => SHARE_ACTIONS.includes(a.$['android:name']))
  );
}

function withMainManifestShare(config) {
  return withAndroidManifest(config, (cfg) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    if (!hasShareFilter(activity)) {
      activity['intent-filter'] = [...(activity['intent-filter'] || []), ...shareFilters()];
    }
    return cfg;
  });
}

function withDebugManifestShare(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, 'app/src/debug/AndroidManifest.xml');
      if (!fs.existsSync(file)) return cfg;
      const manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(file);
      const application = manifest.manifest.application?.[0];
      if (!application) return cfg;
      const activities = application.activity || [];
      let main = activities.find((a) => a.$['android:name'] === '.MainActivity');
      if (!main) {
        main = { $: { 'android:name': '.MainActivity', 'android:exported': 'true' } };
        activities.push(main);
      }
      if (!hasShareFilter(main)) {
        main['intent-filter'] = [...(main['intent-filter'] || []), ...shareFilters()];
      }
      application.activity = activities;
      await AndroidConfig.Manifest.writeAndroidManifestAsync(file, manifest);
      return cfg;
    },
  ]);
}

module.exports = function withMitsitsyOcr(config, { shareTarget = 'debug' } = {}) {
  return shareTarget === 'all' ? withMainManifestShare(config) : withDebugManifestShare(config);
};
