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
