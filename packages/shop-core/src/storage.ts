import { createConfiguredStorage, type ConfiguredStorageExports } from '@team/api';

import { createStoreMapping, type StoreMappingFunctions } from './storeMapping';

export type FullStorageConfig = {
  supabaseUrl: string;
  storageBucket?: string;
};

export type FullStorageExports = ConfiguredStorageExports & StoreMappingFunctions;

/**
 * Creates a fully configured storage object with both storage utilities and store mapping functions.
 * This combines createConfiguredStorage from @team/api with createStoreMapping.
 *
 * @example
 * ```typescript
 * import { createFullStorage } from '@team/shop-core';
 * import { ENV } from './config';
 *
 * export const storage = createFullStorage({
 *   supabaseUrl: ENV.SUPABASE_URL,
 *   storageBucket: ENV.SUPABASE_STORAGE_BUCKET,
 * });
 * ```
 */
export function createFullStorage(config: FullStorageConfig): FullStorageExports {
  const configuredStorage = createConfiguredStorage({
    supabaseUrl: config.supabaseUrl,
    storageBucket: config.storageBucket,
  });

  const storeMapping = createStoreMapping(configuredStorage.buildStorageUrl);

  return {
    ...configuredStorage,
    ...storeMapping,
  };
}
