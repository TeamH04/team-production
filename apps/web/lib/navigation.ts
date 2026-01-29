export const NAV_ITEMS = [
  { href: '/', label: 'ホーム' },
  { href: '/favorites', label: 'お気に入り' },
  { href: '/mypage', label: 'マイページ' },
] as const;

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
