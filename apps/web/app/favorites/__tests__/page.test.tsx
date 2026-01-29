import { createMockShop } from '@team/test-utils';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { nextImageMock, nextLinkMock } from '../../../test-utils';
import FavoritesPage from '../page';

import type { Shop } from '@team/types';

vi.mock('next/image', () => nextImageMock);
vi.mock('next/link', () => nextLinkMock);

// モック状態
let mockShops: Shop[] = [];
let mockFavoriteIds: string[] = [];
let mockLoading = false;
let mockError: Error | null = null;

const mockToggleFavorite = vi.fn();
const mockReload = vi.fn();

vi.mock('../../../lib/dataSource/hooks', () => ({
  useFavoriteShops: () => ({
    shops: mockShops.filter(shop => mockFavoriteIds.includes(shop.id)),
    favoriteIds: mockFavoriteIds,
    loading: mockLoading,
    error: mockError,
    toggleFavorite: mockToggleFavorite,
    reload: mockReload,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/favorites',
}));

describe('FavoritesPage', () => {
  beforeEach(() => {
    mockShops = [
      createMockShop({ id: 'shop-1', name: 'カフェA', tags: ['コーヒー'] }),
      createMockShop({ id: 'shop-2', name: 'カフェB', tags: ['紅茶'] }),
      createMockShop({ id: 'shop-3', name: 'レストランC', category: 'レストラン' }),
    ];
    mockFavoriteIds = ['shop-1', 'shop-2'];
    mockLoading = false;
    mockError = null;
    mockToggleFavorite.mockClear();
    mockReload.mockClear();
  });

  describe('ヘッダー', () => {
    test('タイトルが表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByRole('heading', { name: 'お気に入り' })).toBeInTheDocument();
    });

    test('サブタイトルが表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByText('保存したお店を確認できます')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('loading=trueの場合ローディング表示', () => {
      mockLoading = true;
      render(<FavoritesPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    test('エラーがある場合エラー表示', () => {
      mockError = new Error('取得に失敗しました');
      render(<FavoritesPage />);

      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    });

    test('再試行ボタンでreloadが呼ばれる', async () => {
      const user = userEvent.setup();
      mockError = new Error('取得に失敗しました');
      render(<FavoritesPage />);

      await user.click(screen.getByRole('button', { name: '再試行' }));

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('空状態', () => {
    test('お気に入りがない場合メッセージが表示される', () => {
      mockFavoriteIds = [];
      render(<FavoritesPage />);

      expect(screen.getByText('お気に入りがありません')).toBeInTheDocument();
    });

    test('空状態でアクションボタンが表示される', () => {
      mockFavoriteIds = [];
      render(<FavoritesPage />);

      expect(screen.getByRole('button', { name: 'お店を探す' })).toBeInTheDocument();
    });
  });

  describe('お気に入り一覧', () => {
    test('お気に入り店舗が表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByText('カフェA')).toBeInTheDocument();
      expect(screen.getByText('カフェB')).toBeInTheDocument();
    });

    test('お気に入りでない店舗は表示されない', () => {
      render(<FavoritesPage />);

      expect(screen.queryByText('レストランC')).not.toBeInTheDocument();
    });

    test('件数が表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByText('2 件のお気に入り')).toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    test('検索入力欄が表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByPlaceholderText('お気に入りから検索')).toBeInTheDocument();
    });

    test('検索テキストで絞り込みができる', async () => {
      const user = userEvent.setup();
      render(<FavoritesPage />);

      const input = screen.getByPlaceholderText('お気に入りから検索');
      await user.type(input, 'カフェA');

      await waitFor(() => {
        expect(screen.getByText('カフェA')).toBeInTheDocument();
      });
    });
  });

  describe('ソート機能', () => {
    test('ソートセレクターが表示される', () => {
      render(<FavoritesPage />);

      expect(screen.getByRole('button', { name: '新着順' })).toBeInTheDocument();
    });
  });

  describe('お気に入り解除', () => {
    test('ハートボタンでtoggleFavoriteが呼ばれる', async () => {
      const user = userEvent.setup();
      render(<FavoritesPage />);

      const favoriteButtons = screen.getAllByRole('button', { name: 'お気に入りから削除' });
      await user.click(favoriteButtons[0]);

      expect(mockToggleFavorite).toHaveBeenCalledWith('shop-1');
    });
  });
});
