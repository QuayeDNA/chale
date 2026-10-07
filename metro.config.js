// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// TanStack Query v5 ships ESM with explicit `.js` extensions (build/modern/*.js)
// and an `exports` map with `import`/`require` conditions. Metro needs
// package-exports enabled to resolve it correctly on native.
// Without this, `Unable to resolve "./useQueries.js" from .../build/modern/index.js`.
config.resolver.unstable_enablePackageExports = true;

// Import .svg files as react-native-svg components.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts.push('svg');

module.exports = config;
