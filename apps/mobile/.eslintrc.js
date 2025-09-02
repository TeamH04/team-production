/* eslint-env node */
const path = require('path');

module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    // eslint-disable-next-line no-undef
    project: [path.join(__dirname, 'tsconfig.json')],
    // eslint-disable-next-line no-undef
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@typescript-eslint', 'import'],
  settings: {
    'import/resolver': {
      typescript: {
        // eslint-disable-next-line no-undef
        project: path.join(__dirname, 'tsconfig.json'),
        alwaysTryTypes: true,
      },
      alias: {
        map: [
          // eslint-disable-next-line no-undef
          ['@', __dirname],
          // eslint-disable-next-line no-undef
          ['~', path.join(__dirname, 'app')],
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    },
    react: { version: 'detect' },
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages', {
      ts: 'never',
      tsx: 'never',
      js: 'never',
      jsx: 'never',
    }],
  },
};
