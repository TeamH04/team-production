/**
 * Common UI labels shared across web and mobile applications.
 * These labels should be used instead of hardcoded strings to ensure consistency.
 */

export const UI_LABELS = {
  /** "おすすめ" label for recommended items */
  RECOMMENDED: 'おすすめ',
  /** "すべて" label for all categories */
  ALL: 'すべて',
  /** "新着順" label for newest first sort */
  SORT_NEWEST: '新着順',
  /** "高い順" label for price high to low sort */
  SORT_PRICE_HIGH: '高い順',
  /** "低い順" label for price low to high sort */
  SORT_PRICE_LOW: '低い順',
  /** "メニュー" label for menu */
  MENU: 'メニュー',
  /** "ログイン" label for login */
  LOGIN: 'ログイン',
  /** "キャンセル" label for cancel */
  CANCEL: 'キャンセル',
  /** "戻る" label for back button */
  BACK: '戻る',
  /** "おすすめメニュー" label for recommended menu section */
  RECOMMENDED_MENU: 'おすすめメニュー',
} as const;

export type UILabelKey = keyof typeof UI_LABELS;
