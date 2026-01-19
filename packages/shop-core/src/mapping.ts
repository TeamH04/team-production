import { formatPrice } from '@team/constants';

import { IMAGE_POOL } from './constants';

import type { StorageUrlResolver } from './types';
import type { ApiStore, Shop, ShopCategory, MoneyBucket } from '@team/types';

const DEFAULT_CATEGORY: ShopCategory = 'カフェ・喫茶';
const DEFAULT_BUDGET: MoneyBucket = '$$';
const DEFAULT_DISTANCE_MINUTES = 5;
const DEFAULT_RATING = 0;
const DEFAULT_IMAGE_URL = IMAGE_POOL[0]; // コーヒー

const VALID_CATEGORIES: readonly ShopCategory[] = [
  'レストラン',
  'カフェ・喫茶',
  'ベーカリー・パン',
  'スイーツ・デザート専門',
  'ファストフード・テイクアウト',
  'バー・居酒屋',
  'ビュッフェ・食べ放題',
] as const;

const VALID_BUDGETS: readonly MoneyBucket[] = ['$', '$$', '$$$'] as const;

function isValidCategory(value: string): value is ShopCategory {
  return VALID_CATEGORIES.includes(value as ShopCategory);
}

function isValidBudget(value: string): value is MoneyBucket {
  return VALID_BUDGETS.includes(value as MoneyBucket);
}

// デフォルトのURL解決（何もしない、またはhttpで始まればそのまま）
const defaultUrlResolver: StorageUrlResolver = path => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return undefined;
};

const DEFAULT_DATE = '1970-01-01T00:00:00.000Z';

function normalizeDate(value?: string | null, defaultDate = DEFAULT_DATE): string {
  if (value?.trim()) {
    return value;
  }
  return defaultDate;
}

function normalizeImageUrl(
  value: string | null | undefined,
  resolver: StorageUrlResolver,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http')) return trimmed;
  return resolver(trimmed);
}

export function mapApiStoreToShop(
  store: ApiStore,
  urlResolver: StorageUrlResolver = defaultUrlResolver,
): Shop {
  // APIデータを優先使用、フォールバックはデフォルト値のみ
  const apiThumbnailUrl = normalizeImageUrl(
    store.thumbnail_file?.url ?? store.thumbnail_file?.object_key,
    urlResolver,
  );
  const apiImageUrls = store.image_urls
    ?.map(url => normalizeImageUrl(url, urlResolver))
    .filter((url): url is string => !!url);
  const imageUrl = apiThumbnailUrl || apiImageUrls?.[0] || DEFAULT_IMAGE_URL;
  const imageUrls = apiImageUrls ?? (imageUrl ? [imageUrl] : undefined);

  const category = isValidCategory(store.category) ? store.category : DEFAULT_CATEGORY;
  const distanceMinutes = store.distance_minutes ?? DEFAULT_DISTANCE_MINUTES;
  const rating = store.average_rating ?? DEFAULT_RATING;
  const budget = isValidBudget(store.budget) ? store.budget : DEFAULT_BUDGET;
  const tags = store.tags ?? [];
  const createdAt = normalizeDate(store.created_at);
  const openedAt = normalizeDate(store.opened_at, createdAt);
  const description = store.description ?? '';
  const address = store.address?.trim() ?? '';

  // place_id は Google Place ID で、マップ連携に必須
  // 空の場合、UI側で !placeId チェックにより機能を無効化
  const placeId = store.place_id?.trim() || '';
  // メニュー項目のマッピング
  // category フォールバック: バックエンドのレガシーデータでは category が未設定で
  // description にカテゴリ情報が含まれている場合があるため、description をフォールバックとして使用
  const menu =
    store.menus?.map(item => ({
      id: item.menu_id,
      name: item.name,
      category: item.category?.trim() ?? item.description?.trim() ?? '',
      price: item.price != null ? formatPrice(item.price) : '',
      description: item.description ?? undefined,
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

export function mapApiStoresToShops(stores: ApiStore[], urlResolver?: StorageUrlResolver): Shop[] {
  return stores.map(store => mapApiStoreToShop(store, urlResolver));
}
