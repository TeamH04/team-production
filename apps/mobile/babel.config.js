module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    require.resolve('expo-router/babel'),
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': '.',
        },
      },
    ],
  ],
};
