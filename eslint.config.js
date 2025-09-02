// eslint.config.js（ルート）
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import path from 'node:path';

export default [
  { ignores: ['eslint.config.js', '**/node_modules/**', '**/dist/**', '**/.expo/**', '**/.eas/**', '**/web-build/**'] },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }, // 型なし運用
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { '@typescript-eslint': tsPlugin, react, 'react-hooks': reactHooks, import: importPlugin },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-native/no-raw-text': ['error', { skip: ['ThemedText'] }],
      'import/no-unresolved': 'error',
      'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' }],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // ★ Expo / mobile 用の resolver をここで確実に適用
  {
    files: ['apps/mobile/**/*.{ts,tsx,js,jsx}'],
    plugins: { 'react-native': reactNative },
    settings: {
      'import/resolver': {
        typescript: {
          // tsconfig の paths (= @, ~) を使わせる
          project: [path.resolve(process.cwd(), 'apps/mobile/tsconfig.json')],
          alwaysTryTypes: true,
        },
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
      },
      react: { version: 'detect' },
    },
    rules: {
      ...reactNative.configs.all.rules,
      'react-native/no-inline-styles': 'warn',
      'react-native/split-platform-components': 'off',
    },
  },
];
