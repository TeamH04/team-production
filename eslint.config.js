// eslint.config.js（ルート）
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import path from 'node:path';

export default [
  {
    ignores: [
      'eslint.config.js',
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/.eas/**',
      '**/web-build/**',
      '**/.next/**',
      '**/next-env.d.ts',
    ],
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: path.resolve(process.cwd(), 'tsconfig.eslint.json'),
        tsconfigRootDir: process.cwd(),
        noWarnOnMultipleProjects: true,
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: [path.resolve(process.cwd(), 'tsconfig.eslint.json')],
          alwaysTryTypes: true,
        },
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'import/no-unresolved': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      // Prettierとの競合回避のため、関連ルールを無効化
      ...prettierConfig.rules,
    },
  },

  // JavaScript ファイル用の設定（parserOptionsなし）
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.json'] },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'import/no-unresolved': 'error',
      ...prettierConfig.rules,
    },
  },

  // Next.js / web 用設定
  {
    files: ['apps/web/**/*.{ts,tsx,js,jsx}'],
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: [path.resolve(process.cwd(), 'apps/web/tsconfig.json')],
          alwaysTryTypes: true,
        },
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
      },
    },
    rules: {
      'react-native/no-raw-text': 'off',
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
      'react-native/no-raw-text': ['error', { skip: ['ThemedText'] }],
      'react-native/split-platform-components': 'off',
    },
  },
];
