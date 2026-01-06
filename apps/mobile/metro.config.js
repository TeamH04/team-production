const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const workspaceSvg = path.resolve(workspaceRoot, 'node_modules/react-native-svg');

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
  },
  assetExts: assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...new Set([...sourceExts, 'svg'])],
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],

  disableHierarchicalLookup: false,
};

module.exports = withNativeWind(config, { input: './global.css' });
