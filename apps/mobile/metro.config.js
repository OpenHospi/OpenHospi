const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
// const { withSentryConfig } = require('@sentry/react-native/metro');
// const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
//
// // config.resolver.sourceExts.push('sql');
//
// const uniwindConfig = withUniwindConfig(config, {
//   cssEntryFile: './global.css',
//   dtsFile: './uniwind-types.d.ts',
// });
//
// module.exports = withSentryConfig(uniwindConfig);

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: './src/global.css',
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: './src/uniwind-types.d.ts',
});
