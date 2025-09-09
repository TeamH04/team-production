module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // まず plugins を空にして通るか検証
    plugins: [
      'expo-router/babel',
      ['module-resolver', {
        root: ['.'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: { '@': './' },
      }],
    ],
  };
};