/**
 * レビュー設定
 */
export const REVIEW_CONFIG = {
  /** 最大画像数 */
  MAX_IMAGES: 6,
  /** 画像品質 (0-1) */
  IMAGE_QUALITY: 0.8,
} as const;

/**
 * 評価カテゴリの定義
 * レビュー投稿画面とレビュー一覧表示で共通して使用
 */
export const RATING_CATEGORIES = [
  { key: 'taste', label: '味' },
  { key: 'atmosphere', label: '雰囲気' },
  { key: 'service', label: '接客' },
  { key: 'speed', label: '提供速度' },
  { key: 'cleanliness', label: '清潔感' },
] as const;

export type RatingCategoryKey = (typeof RATING_CATEGORIES)[number]['key'];

/**
 * 評価値に対応する表示情報
 * icon: Ionicons のアイコン名
 * label: 表示ラベル
 * sentiment: 感情タイプ（色の決定に使用）
 */
export type RatingSentiment = 'satisfied' | 'neutral' | 'dissatisfied';

export type RatingDisplay = {
  icon: 'happy' | 'remove' | 'sad';
  label: string;
  sentiment: RatingSentiment;
};

/**
 * 評価値から表示情報を取得
 * @param value 評価値 (1-5)
 * @returns 表示情報（アイコン、ラベル、感情タイプ）
 */
export function getRatingDisplay(value: number): RatingDisplay {
  if (value === 5) return { icon: 'happy', label: '満足', sentiment: 'satisfied' };
  if (value === 4) return { icon: 'remove', label: '普通', sentiment: 'neutral' };
  return { icon: 'sad', label: '不満', sentiment: 'dissatisfied' };
}
