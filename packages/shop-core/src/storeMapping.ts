import { mapApiStoreToShop, mapApiStoresToShops } from './mapping';

import type { StorageUrlResolver } from './types';
import type { ApiStore, Shop } from '@team/types';

export interface StoreMappingFunctions {
  mapStore: (store: ApiStore) => Shop;
  mapStores: (stores: ApiStore[]) => Shop[];
}

/**
 * Creates store mapping functions bound to a specific storage URL resolver.
 * This allows apps to inject their environment-specific URL resolution.
 */
export function createStoreMapping(resolveStorageUrl: StorageUrlResolver): StoreMappingFunctions {
  const mapStore = (store: ApiStore): Shop => mapApiStoreToShop(store, resolveStorageUrl);
  const mapStores = (stores: ApiStore[]): Shop[] => mapApiStoresToShops(stores, resolveStorageUrl);
  return { mapStore, mapStores };
}
