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
export const toggleGenre = (genres: string[], genre: string): string[] => {
  return genres.includes(genre) ? genres.filter(g => g !== genre) : [...genres, genre];
};
