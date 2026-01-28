/**
 * 共通スタイル定数
 * Tailwind CSSクラス文字列の重複を解消
 */

/**
 * 共通のEmptyStateアクション（「お店を探す」ボタン）
 */
export function createNavigateToHomeAction() {
  return {
    label: 'お店を探す',
    onClick: () => {
      window.location.href = '/';
    },
  };
}

export const STYLES = {
  /** ページ背景 */
  PAGE_BACKGROUND: 'min-h-screen bg-slate-50',

  /** メインコンテナ */
  CONTAINER: 'mx-auto max-w-6xl px-6 lg:px-10',

  /** ヘッダーグラデーション */
  HEADER_GRADIENT: 'bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700 text-white',

  /** カードベース */
  CARD: 'rounded-3xl bg-white shadow-lg ring-1 ring-slate-100',

  /** 検索入力フィールド */
  SEARCH_INPUT:
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100',

  /** プライマリボタン */
  BUTTON_PRIMARY:
    'rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800',

  /** セクションタイトル（ラベル） */
  SECTION_LABEL: 'text-sm font-semibold uppercase tracking-[0.18em] text-slate-500',

  /** ページタイトル */
  PAGE_TITLE: 'text-3xl font-bold',
} as const;

/**
 * レビュー表示数の定数
 */
export const REVIEW_LIMITS = {
  /** ページコンテンツでのレビュー表示数上限 */
  MAX_VISIBLE_REVIEWS: 10,
  /** サイドバーでのレビュー表示数上限 */
  MAX_SIDEBAR_REVIEWS: 5,
} as const;
