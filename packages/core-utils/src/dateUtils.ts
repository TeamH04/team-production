/**
 * 日付フォーマットユーティリティ
 */

/**
 * 日付を日本語ロケールでフォーマットする
 *
 * @param date - ISO日付文字列またはDateオブジェクト
 * @returns 'YYYY/MM/DD' 形式の文字列（例: '2024/01/15'）
 *
 * @example
 * ```ts
 * formatDateJa('2024-01-15T10:30:00Z') // '2024/01/15'
 * formatDateJa(new Date(2024, 0, 15))  // '2024/01/15'
 * ```
 */
export function formatDateJa(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ja-JP');
}
