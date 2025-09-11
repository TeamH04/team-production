const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  __dirname + "/node_modules",
  __dirname + "/../../node_modules",
];

module.exports = withNativeWind(config, { input: "./global.css" });
