/**
 * 文字列ユーティリティ関数
 */

/**
 * 文字列を正規化（前後の空白を除去し、小文字に変換）
 * @param str 対象の文字列
 * @returns 正規化された文字列
 */
export function normalizeString(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * 大文字小文字を無視して文字列が含まれているか判定
 * @param haystack 検索対象の文字列
 * @param needle 検索する文字列
 * @returns needle が haystack に含まれる場合 true
 */
export function includesIgnoreCase(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
