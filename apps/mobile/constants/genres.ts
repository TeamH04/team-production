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
