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

const MOBILE_NODE_MODULES = path.resolve(process.cwd(), 'apps/mobile/node_modules');

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
      'nativewind-env.d.ts',
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
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
        typescript: {
          project: [path.resolve(process.cwd(), 'tsconfig.eslint.json')],
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '^next/',
            'react-native-svg',
            '^expo',
            '^@expo/',
            'react-native',
            '^react-native/',
          ],
        },
      ],
      'import/extensions': [
        'error',
        'ignorePackages',
        { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' },
      ],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      // Prettierとの競合回避のため、関連ルールを無効化
      ...prettierConfig.rules,
    },
  },

  // テストファイル用設定
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/vitest.config.ts',
      '**/vitest.setup.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '@testing-library/react',
            '@testing-library/user-event',
            '@testing-library/jest-dom',
            '@testing-library/jest-dom/vitest',
            'vitest',
            'vitest/config',
            '@vitejs/plugin-react',
            '@team/test-utils',
          ],
        },
      ],
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
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
        typescript: {
          project: [path.resolve(process.cwd(), 'apps/web/tsconfig.json')],
          alwaysTryTypes: true,
        },
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
        node: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          paths: [MOBILE_NODE_MODULES],
        },
        typescript: {
          // tsconfig の paths (= @, ~) を使わせる
          project: [path.resolve(process.cwd(), 'apps/mobile/tsconfig.json')],
          alwaysTryTypes: true,
        },
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
