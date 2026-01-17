export const STORAGE_KEYS = {
  FAVORITES: 'shop-favorites',
  SEARCH_HISTORY: 'shop-search-history',
  VISITED: 'shop-visited',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
