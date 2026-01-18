/**
 * 配列操作ユーティリティ
 */

/**
 * 配列内のアイテムをトグル（存在すれば削除、なければ追加）
 * @param arr 対象の配列
 * @param item トグルするアイテム
 * @returns 新しい配列
 */
export function toggleArrayItem<T>(arr: readonly T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(existing => existing !== item) : [...arr, item];
}

/**
 * 配列にアイテムを追加（既に存在する場合は何もしない）
 * @param arr 対象の配列
 * @param item 追加するアイテム
 * @returns 新しい配列
 */
export function addToArray<T>(arr: readonly T[], item: T): T[] {
  return arr.includes(item) ? [...arr] : [...arr, item];
}

/**
 * 配列からアイテムを削除
 * @param arr 対象の配列
 * @param item 削除するアイテム
 * @returns 新しい配列
 */
export function removeFromArray<T>(arr: readonly T[], item: T): T[] {
  return arr.filter(existing => existing !== item);
}
