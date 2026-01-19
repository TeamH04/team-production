import { createFullStorage } from '@team/shop-core';

import { ENV } from './config';

export const storage = createFullStorage({
  supabaseUrl: ENV.SUPABASE_URL,
  storageBucket: ENV.SUPABASE_STORAGE_BUCKET,
});
