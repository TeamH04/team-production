/**
 * 店舗ジャンルの定数定義
 */
export const GENRES = [
  'カフェ',
  '和食',
  '居酒屋',
  'イタリアン',
  'フレンチ',
  '中華',
  'ベーカリー',
  'バー',
  'スイーツ',
  'その他',
] as const;

/** ジャンルの型 */
export type Genre = (typeof GENRES)[number];

/**
 * ジャンルの選択状態をトグルする
 * @param genres - 現在選択されているジャンルの配列
 * @param genre - トグル対象のジャンル名
 * @returns 新しいジャンル配列
 */
/**
 * 配列から要素をトグル（存在すれば削除、なければ追加）
 * Note: core-utils/toggleArrayItem と同じロジックだが、
 * 循環依存を避けるためここでインライン実装
 */
export function toggleGenre(genres: readonly Genre[], genre: Genre): Genre[] {
  const result: Genre[] = [];
  let found = false;
  for (const existing of genres) {
    if (existing === genre) {
      found = true;
    } else {
      result.push(existing);
    }
  }
  if (!found) {
    result.push(genre);
  }
  return result;
}
