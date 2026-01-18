import { createConfiguredStorage } from '@team/api';
import { createStoreMapping } from '@team/shop-core';

import { ENV } from '@/lib/config';

const configuredStorage = createConfiguredStorage({
  supabaseUrl: ENV.SUPABASE_URL,
  storageBucket: ENV.SUPABASE_STORAGE_BUCKET,
});

const storeMapping = createStoreMapping(configuredStorage.buildStorageUrl);

export const storage = {
  ...configuredStorage,
  ...storeMapping,
};
