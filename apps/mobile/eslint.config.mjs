// apps/mobile/eslint.config.js
import path from 'node:path';
import rootConfig from '../../eslint.config.js';

// Re-export root config but adjust paths to work from mobile directory
export default rootConfig.map(config => {
  if (config.languageOptions?.parserOptions?.project) {
    return {
      ...config,
      languageOptions: {
        ...config.languageOptions,
        parserOptions: {
          ...config.languageOptions.parserOptions,
          project: path.resolve(import.meta.dirname, '../../tsconfig.eslint.json'),
          tsconfigRootDir: path.resolve(import.meta.dirname, '../..'),
        },
      },
    };
  }
  return config;
});
