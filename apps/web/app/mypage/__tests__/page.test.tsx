import { DEMO_USER } from '@team/constants';
import { createMockReviewWithUser, createMockShop } from '@team/test-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { nextLinkMock } from '../../../test-utils';
import MyPage from '../page';

import type { ReviewWithUser, Shop } from '@team/types';

vi.mock('next/link', () => nextLinkMock);

// モック状態
let mockFavoriteIds: string[] = [];
let mockShops: Shop[] = [];
let mockUserReviews: ReviewWithUser[] = [];
let mockFavoritesLoading = false;
let mockShopsLoading = false;
let mockReviewsLoading = false;
let mockFavoritesError: Error | null = null;
let mockShopsError: Error | null = null;
let mockReviewsError: Error | null = null;

const mockReloadFavorites = vi.fn();
const mockReloadShops = vi.fn();
const mockReloadReviews = vi.fn();

vi.mock('../../../lib/dataSource/hooks', () => ({
  useFavorites: () => ({
    favoriteIds: mockFavoriteIds,
    loading: mockFavoritesLoading,
    error: mockFavoritesError,
    reload: mockReloadFavorites,
  }),
  useShops: () => ({
    shops: mockShops,
    loading: mockShopsLoading,
    error: mockShopsError,
    reload: mockReloadShops,
  }),
  useUserReviews: () => ({
    reviews: mockUserReviews,
    loading: mockReviewsLoading,
    error: mockReviewsError,
    reload: mockReloadReviews,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/mypage',
}));

describe('MyPage', () => {
  beforeEach(() => {
    mockFavoriteIds = ['shop-1', 'shop-2'];
    mockShops = [
      createMockShop({ id: 'shop-1', name: 'カフェA' }),
      createMockShop({ id: 'shop-2', name: 'カフェB' }),
    ];
    mockUserReviews = [
      createMockReviewWithUser({
        id: 'review-1',
        shopId: 'shop-1',
        userId: DEMO_USER.id,
        userName: DEMO_USER.name,
        rating: 5,
        comment: '最高でした',
      }),
    ];
    mockFavoritesLoading = false;
    mockShopsLoading = false;
    mockReviewsLoading = false;
    mockFavoritesError = null;
    mockShopsError = null;
    mockReviewsError = null;
    mockReloadFavorites.mockClear();
    mockReloadShops.mockClear();
    mockReloadReviews.mockClear();
  });

  describe('ヘッダー', () => {
    test('タイトルが表示される', () => {
      render(<MyPage />);

      expect(screen.getByRole('heading', { name: 'マイページ' })).toBeInTheDocument();
    });

    test('サブタイトルが表示される', () => {
      render(<MyPage />);

      expect(screen.getByText('あなたの活動履歴を確認できます')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('お気に入りローディング中はローディング表示', () => {
      mockFavoritesLoading = true;
      render(<MyPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('店舗ローディング中はローディング表示', () => {
      mockShopsLoading = true;
      render(<MyPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('レビューローディング中はローディング表示', () => {
      mockReviewsLoading = true;
      render(<MyPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    test('エラーがある場合エラー表示', () => {
      mockFavoritesError = new Error('取得失敗');
      render(<MyPage />);

      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    });

    test('再試行ボタンで全reloadが呼ばれる', async () => {
      const user = userEvent.setup();
      mockFavoritesError = new Error('取得失敗');
      render(<MyPage />);

      await user.click(screen.getByRole('button', { name: '再試行' }));

      expect(mockReloadFavorites).toHaveBeenCalled();
      expect(mockReloadShops).toHaveBeenCalled();
      expect(mockReloadReviews).toHaveBeenCalled();
    });
  });

  describe('ユーザー情報', () => {
    test('ユーザー名が表示される', () => {
      render(<MyPage />);

      // DEMO_USER.nameは複数箇所に表示される可能性がある
      expect(screen.getAllByText(DEMO_USER.name).length).toBeGreaterThanOrEqual(1);
    });

    test('ユーザー名の頭文字がアバターに表示される', () => {
      render(<MyPage />);

      // 頭文字も複数箇所に表示される可能性がある
      expect(screen.getAllByText(DEMO_USER.name.charAt(0)).length).toBeGreaterThanOrEqual(1);
    });

    test('デモモードの案内が表示される', () => {
      render(<MyPage />);

      expect(
        screen.getByText('デモモードで利用中です。データはローカルに保存されます。'),
      ).toBeInTheDocument();
    });
  });

  describe('統計情報', () => {
    test('お気に入り数が表示される', () => {
      render(<MyPage />);

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('お気に入り')).toBeInTheDocument();
    });

    test('レビュー数が表示される', () => {
      render(<MyPage />);

      // 統計セクションでレビュー数が表示される
      const reviewCounts = screen.getAllByText('1');
      expect(reviewCounts.length).toBeGreaterThanOrEqual(1);
      // 「投稿したレビュー」は複数箇所に表示される
      expect(screen.getAllByText(/投稿したレビュー/).length).toBeGreaterThanOrEqual(1);
    });

    test('お気に入りリンクが正しいhrefを持つ', () => {
      render(<MyPage />);

      const links = screen.getAllByRole('link', { name: /お気に入り/ });
      const favoriteLink = links.find(link => link.getAttribute('href') === '/favorites');
      expect(favoriteLink).toBeInTheDocument();
    });
  });

  describe('クイックリンク', () => {
    test('「お店を探す」リンクが表示される', () => {
      render(<MyPage />);

      expect(screen.getByRole('link', { name: 'お店を探す →' })).toBeInTheDocument();
    });

    test('「お気に入りを見る」リンクが表示される', () => {
      render(<MyPage />);

      expect(screen.getByRole('link', { name: 'お気に入りを見る →' })).toBeInTheDocument();
    });
  });

  describe('レビュー一覧', () => {
    test('レビューセクションヘッダーが表示される', () => {
      render(<MyPage />);

      // 「投稿したレビュー」は複数箇所に表示される（統計とセクションヘッダー）
      expect(screen.getAllByText(/投稿したレビュー/).length).toBeGreaterThanOrEqual(1);
    });

    test('レビュー件数バッジが表示される', () => {
      render(<MyPage />);

      expect(screen.getByText('1 件')).toBeInTheDocument();
    });

    test('レビューがない場合は空状態メッセージが表示される', () => {
      mockUserReviews = [];
      render(<MyPage />);

      expect(screen.getByText('まだレビューがありません')).toBeInTheDocument();
    });

    test('レビューがある場合は店舗名リンクが表示される', () => {
      render(<MyPage />);

      expect(screen.getByRole('link', { name: 'カフェA' })).toBeInTheDocument();
    });

    test('店舗名リンクは店舗詳細ページへのリンク', () => {
      render(<MyPage />);

      const shopLink = screen.getByRole('link', { name: 'カフェA' });
      expect(shopLink).toHaveAttribute('href', '/shop/shop-1');
    });

    test('レビューコメントが表示される', () => {
      render(<MyPage />);

      expect(screen.getByText('最高でした')).toBeInTheDocument();
    });
  });

  describe('多数のレビュー', () => {
    test('11件以上のレビューがある場合「他N件」が表示される', () => {
      mockUserReviews = Array.from({ length: 12 }, (_, i) =>
        createMockReviewWithUser({
          id: `review-${i}`,
          shopId: 'shop-1',
          userId: DEMO_USER.id,
          userName: DEMO_USER.name,
        }),
      );
      render(<MyPage />);

      expect(screen.getByText('他 2 件のレビュー')).toBeInTheDocument();
    });
  });
});
