// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// TanStack Query v5 ships ESM with explicit `.js` extensions (build/modern/*.js)
// and an `exports` map with `import`/`require` conditions. Metro needs
// package-exports enabled to resolve it correctly on native.
// Without this, `Unable to resolve \"./useQueries.js\" from .../build/modern/index.js`.
config.resolver.unstable_enablePackageExports = true;

// lucide-react-native 1.46 ships ESM as `.mjs` with `export ... from './icons/*.mjs'`.
// With package-exports enabled Metro resolves the `react-native`/`import`
// condition to `dist/esm/lucide-react-native.mjs`, then fails to resolve
// the relative `.mjs` imports (`./icons/heading-1.mjs`) on this Metro version.
// Force the CJS build (`.js` + `require`) which Metro handles correctly.
const origResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'lucide-react-native') {
    return context.resolveRequest(
      context,
      'lucide-react-native/dist/cjs/lucide-react-native.js',
      platform,
    );
  }
  if (origResolveRequest) return origResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
