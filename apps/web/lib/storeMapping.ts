import {
  mapApiStoreToShop as mapApiStoreToShopCore,
  mapApiStoresToShops as mapApiStoresToShopsCore,
} from '@team/shop-core';

import type { ApiStore, Shop } from '@team/types';

// Web version does not perform custom image path resolution (e.g., Supabase Storage dependencies).
// It uses API responses or default values directly, so no resolver is passed.
export function mapApiStoreToShop(store: ApiStore): Shop {
  return mapApiStoreToShopCore(store);
}

export function mapApiStoresToShops(stores: ApiStore[]): Shop[] {
  return mapApiStoresToShopsCore(stores);
}
