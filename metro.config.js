// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-i18next's ESM "exports" entry references sibling files that Metro's
// package-exports resolver can't resolve; falling back to "main" fixes it.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
