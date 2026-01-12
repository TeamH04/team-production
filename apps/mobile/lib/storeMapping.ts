import { SHOPS, type Shop } from '@team/shop-core';

import type { ApiStore } from './api';

const DEFAULT_CATEGORY: Shop['category'] = 'カフェ・喫茶';
const DEFAULT_BUDGET: Shop['budget'] = '$$';
const DEFAULT_DISTANCE_MINUTES = 5;
const DEFAULT_RATING = 4.5;
const DEFAULT_IMAGE_URL =
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80';

const MOCK_BY_NAME = new Map<string, Shop>(SHOPS.map(shop => [shop.name, shop]));

function normalizeDate(value?: string | null, fallback?: string): string {
  if (value && value.trim()) {
    return value;
  }
  if (fallback && fallback.trim()) {
    return fallback;
  }
  return new Date().toISOString();
}

export function mapApiStoreToShop(store: ApiStore): Shop {
  const mock = MOCK_BY_NAME.get(store.name);

  const apiThumbnailUrl = store.thumbnail_file?.object_key?.trim();
  const resolvedThumbnailUrl =
    apiThumbnailUrl && apiThumbnailUrl.length > 0 ? apiThumbnailUrl : undefined;
  const imageUrl = resolvedThumbnailUrl ?? mock?.imageUrl ?? DEFAULT_IMAGE_URL;
  const imageUrls = resolvedThumbnailUrl
    ? [resolvedThumbnailUrl, ...(mock?.imageUrls ?? [])]
    : (mock?.imageUrls ?? (imageUrl ? [imageUrl] : undefined));
  const category = mock?.category ?? DEFAULT_CATEGORY;
  const distanceMinutes = mock?.distanceMinutes ?? DEFAULT_DISTANCE_MINUTES;
  const rating = mock?.rating ?? DEFAULT_RATING;
  const budget = mock?.budget ?? DEFAULT_BUDGET;
  const tags = mock?.tags ?? [];
  const createdAt = normalizeDate(store.created_at, mock?.createdAt);
  const openedAt = normalizeDate(store.opened_at, mock?.openedAt ?? createdAt);
  const description = store.description ?? mock?.description ?? '';
  const placeId = store.place_id ?? mock?.placeId ?? '';
  const menu = store.menus?.map(item => ({ id: item.menu_id, name: item.name })) ?? [];

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
