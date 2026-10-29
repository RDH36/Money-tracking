const { withAppBuildGradle } = require('expo/config-plugins');

// Debug builds install next to the Play Store app (com.rdh36.moneytracking.dev).
// Release builds keep the production applicationId untouched.
const DEBUG_BLOCK = /(buildTypes\s*\{\s*debug\s*\{\s*signingConfig signingConfigs\.debug)/;

module.exports = function withDebugAppIdSuffix(config, { suffix = '.dev' } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (gradle.includes('applicationIdSuffix')) return cfg;
    if (!DEBUG_BLOCK.test(gradle)) {
      throw new Error('withDebugAppIdSuffix: debug buildType not found in app/build.gradle');
    }
    cfg.modResults.contents = gradle.replace(DEBUG_BLOCK, `$1\n            applicationIdSuffix "${suffix}"`);
    return cfg;
  });
};
