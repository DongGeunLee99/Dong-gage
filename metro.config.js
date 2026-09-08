// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-i18next's ESM "exports" entry references sibling files that Metro's
// package-exports resolver can't resolve; falling back to "main" fixes it.
config.resolver.unstable_enablePackageExports = false;

// Import .svg files as React components (react-native-svg) instead of static
// image assets, so category icons can be recolored at runtime via `color`
// (see .svgrrc for the black -> currentColor swap that makes this work).
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
