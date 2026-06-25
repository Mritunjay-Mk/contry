const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Optional: Configure asset extensions
  config.resolver.assetExts.push('cjs');

  // Add support for TypeScript path aliases
  // This allows using @/ components and other path mappings from tsconfig.json
  const { resolver: { sourceExts, assetExts } } = config;
  config.resolver = {
    ...config.resolver,
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs'],
    assetParams: {
      ...(config.resolver.assetParams || {}),
      // Optional: optimize images
      // https://docs.expo.dev/guides/optimizing/#optimize-images
    },
  };

  // Add alias support
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    '@': require('path').resolve(__dirname, 'client'),
  };

  return config;
})();