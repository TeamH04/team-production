const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const workspaceSvg = path.resolve(workspaceRoot, 'node_modules/react-native-svg');

// Ensure NativeWind uses the mobile app Tailwind config within the monorepo
const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
process.env.TAILWIND_CONFIG_PATH = tailwindConfigPath;
process.env.TAILWIND_CONFIG = tailwindConfigPath;

const config = getDefaultConfig(projectRoot);

const { assetExts, sourceExts } = config.resolver;

config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    'react-native-svg': workspaceSvg,
    'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
    'react-native/Libraries/Core/InitializeCore': path.resolve(
      workspaceRoot,
      'node_modules/react-native/Libraries/Core/InitializeCore.js',
    ),
  },
  assetExts: assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...new Set([...sourceExts, 'svg'])],
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],

  disableHierarchicalLookup: false,
  unstable_enablePackageExports: false,
};

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: tailwindConfigPath,
});
