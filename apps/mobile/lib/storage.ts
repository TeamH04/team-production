import { createConfiguredStorage } from '@team/api';
import { createStoreMapping } from '@team/shop-core';

const configuredStorage = createConfiguredStorage({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  storageBucket: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET,
});

const storeMapping = createStoreMapping(configuredStorage.buildStorageUrl);

export const storage = {
  ...configuredStorage,
  ...storeMapping,
};
