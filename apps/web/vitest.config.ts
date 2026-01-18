import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,tsx}', 'lib/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: resolve(rootDir, 'node_modules/react'),
      'react-dom': resolve(rootDir, 'node_modules/react-dom'),
      'react-dom/client': resolve(rootDir, 'node_modules/react-dom/client'),
      '@team/api': resolve(rootDir, 'packages/api/src'),
      '@team/constants': resolve(rootDir, 'packages/constants/src'),
      '@team/core-utils': resolve(rootDir, 'packages/core-utils/src'),
      '@team/hooks': resolve(rootDir, 'packages/hooks/src'),
      '@team/shop-core': resolve(rootDir, 'packages/shop-core/src'),
      '@team/test-utils': resolve(rootDir, 'packages/test-utils/src'),
      '@team/theme': resolve(rootDir, 'packages/theme/src'),
      '@team/types': resolve(rootDir, 'packages/types/src'),
    },
  },
});
