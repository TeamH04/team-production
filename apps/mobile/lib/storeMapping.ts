import type { Shop } from '@team/shop-core';

import type { ApiStore } from './api';
import { getPublicStorageUrl } from './storage';

const DEFAULT_CATEGORY: Shop['category'] = 'カフェ・喫茶';
const DEFAULT_BUDGET: Shop['budget'] = '$$';
const DEFAULT_DISTANCE_MINUTES = 5;
const DEFAULT_RATING = 0;
const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';

function normalizeDate(value?: string | null): string {
  if (value?.trim()) {
    return value;
  }
  return new Date().toISOString();
}

function normalizeImageUrl(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http')) return trimmed;
  return getPublicStorageUrl(trimmed) || undefined;
}

export function mapApiStoreToShop(store: ApiStore): Shop {
  // APIデータを優先使用、フォールバックはデフォルト値のみ
  const apiThumbnailUrl = normalizeImageUrl(
    store.thumbnail_file?.url ?? store.thumbnail_file?.object_key
  );
  const apiImageUrls = store.image_urls
    ?.map(normalizeImageUrl)
    .filter((url): url is string => !!url);
  const imageUrl = apiThumbnailUrl || apiImageUrls?.[0] || DEFAULT_IMAGE_URL;
  const imageUrls = apiImageUrls ?? (imageUrl ? [imageUrl] : undefined);

  const category = (store.category as Shop['category']) || DEFAULT_CATEGORY;
  const distanceMinutes = store.distance_minutes ?? DEFAULT_DISTANCE_MINUTES;
  const rating = store.average_rating ?? DEFAULT_RATING;
  const budget = (store.budget as Shop['budget']) || DEFAULT_BUDGET;
  const tags = store.tags ?? [];
  const createdAt = normalizeDate(store.created_at);
  const openedAt = normalizeDate(store.opened_at) || createdAt;
  const description = store.description ?? '';
  const address = store.address?.trim() ?? '';
  const placeId = store.place_id ?? '';
  const menu =
    store.menus?.map(item => ({
      id: item.menu_id,
      name: item.name,
      category: item.description?.trim() ?? '',
      price: item.price != null ? `¥${item.price.toLocaleString()}` : '',
    })) ?? [];

  return {
    id: store.store_id,
    name: store.name,
    category,
    distanceMinutes,
    rating,
    budget,
    createdAt,
    openedAt,
    description,
    address,
    placeId,
    imageUrl,
    imageUrls,
    tags,
    menu: menu.length > 0 ? menu : undefined,
  };
}

export function mapApiStoresToShops(stores: ApiStore[]): Shop[] {
  return stores.map(mapApiStoreToShop);
}
