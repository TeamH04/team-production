import type { Gender } from '@team/types';

/**
 * マッピングオブジェクトを使用してラベルを取得する汎用関数
 */
function formatWithMapping<T extends string>(
  value: T | string | null | undefined,
  mapping: Record<string, string>,
  defaultLabel = '未設定',
): string {
  if (!value) return defaultLabel;
  return mapping[value] ?? value;
}

/**
 * Format a rating value to display (e.g., 4.5 -> "4.5")
 * @param rating - The rating value to format
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatRating(rating: number, decimals: number = 1): string {
  return rating.toFixed(decimals);
}

/**
 * Format a price value with yen symbol
 * @param price - The price value to format
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

/**
 * Format gender value to Japanese label
 * @param value - Gender value ('male', 'female', 'other') or null/undefined
 * @returns Japanese label for the gender
 */
const GENDER_LABELS: Record<string, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
};

export function formatGenderLabel(value: Gender | string | null | undefined): string {
  return formatWithMapping(value, GENDER_LABELS);
}

/**
 * Format authentication provider value to display label
 * @param value - Provider value ('google', 'apple', 'email', 'oauth') or null/undefined
 * @returns Display label for the provider
 */
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  email: 'メール',
  oauth: 'OAuth',
};

export function formatProviderLabel(value: string | null | undefined): string {
  return formatWithMapping(value, PROVIDER_LABELS);
}
