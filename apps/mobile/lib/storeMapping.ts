import {
  mapApiStoreToShop as mapApiStoreToShopCore,
  mapApiStoresToShops as mapApiStoresToShopsCore,
} from '@team/shop-core';

import { getPublicStorageUrl } from './storage';

import type { ApiStore } from './api';
import type { Shop } from '@team/types';

export function mapApiStoreToShop(store: ApiStore): Shop {
  return mapApiStoreToShopCore(store, getPublicStorageUrl);
}

export function mapApiStoresToShops(stores: ApiStore[]): Shop[] {
  return mapApiStoresToShopsCore(stores, getPublicStorageUrl);
}
