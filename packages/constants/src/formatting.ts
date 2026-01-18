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
