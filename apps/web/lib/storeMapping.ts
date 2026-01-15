import type { Shop } from '@team/types';
import type { ApiStore } from './api';

const DEFAULT_CATEGORY: Shop['category'] = 'カフェ・喫茶';
const DEFAULT_BUDGET: Shop['budget'] = '$$';
const DEFAULT_DISTANCE_MINUTES = 5;
const DEFAULT_RATING = 0;
const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';

export function mapApiStoreToShop(store: ApiStore): Shop {
  const imageUrls = store.image_urls?.length ? store.image_urls : undefined;
  const imageUrl = store.thumbnail_file?.url ?? imageUrls?.[0] ?? DEFAULT_IMAGE_URL;

  const menu = store.menus?.map(item => ({
    id: item.menu_id,
    name: item.name,
    category: item.category?.trim() ?? item.description?.trim() ?? '',
    price: item.price != null ? `¥${item.price.toLocaleString()}` : '',
    description: item.description ?? undefined,
  }));

  return {
    id: store.store_id,
    name: store.name,
    category: (store.category as Shop['category']) || DEFAULT_CATEGORY,
    distanceMinutes: store.distance_minutes ?? DEFAULT_DISTANCE_MINUTES,
    rating: store.average_rating ?? DEFAULT_RATING,
    budget: (store.budget as Shop['budget']) || DEFAULT_BUDGET,
    createdAt: store.created_at,
    openedAt: store.opened_at ?? store.created_at,
    description: store.description ?? '',
    address: store.address,
    placeId: store.place_id,
    imageUrl,
    imageUrls,
    tags: store.tags ?? [],
    menu: menu?.length ? menu : undefined,
  };
}

export function mapApiStoresToShops(stores: ApiStore[]): Shop[] {
  return stores.map(mapApiStoreToShop);
}
