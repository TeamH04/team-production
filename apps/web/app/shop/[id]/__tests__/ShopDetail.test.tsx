import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createLocalStorageMock,
  createMockShop,
  nextImageMock,
  nextLinkMock,
} from '../../../../test-utils';
import ShopDetail from '../ShopDetail';

vi.mock('next/image', () => nextImageMock);

vi.mock('next/link', () => nextLinkMock);

const storageMock = createLocalStorageMock();

describe('ShopDetail', () => {
  beforeEach(() => {
    storageMock.reset();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storageMock.mock.getItem(key)),
      setItem: vi.fn((key: string, value: string) => storageMock.mock.setItem(key, value)),
      removeItem: vi.fn((key: string) => storageMock.mock.removeItem(key)),
      clear: vi.fn(() => storageMock.mock.clear()),
    });
  });

  afterEach(() => {
    if (vi.isFakeTimers()) {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
    vi.unstubAllGlobals();
  });

  describe('表示', () => {
    test('店舗名が表示される', () => {
      render(<ShopDetail shop={createMockShop()} />);

      expect(screen.getAllByText('テストカフェ').length).toBeGreaterThan(0);
    });

    test('評価が小数点1桁で表示される', () => {
      render(<ShopDetail shop={createMockShop({ rating: 4.567 })} />);

      expect(screen.getAllByText(/4\.6/).length).toBeGreaterThan(0);
    });

    test('予算ラベルが正しく変換される', () => {
      render(<ShopDetail shop={createMockShop({ budget: '$$$' })} />);

      expect(screen.getAllByText(/¥¥¥/).length).toBeGreaterThan(0);
    });

    test('タグがリンクとして表示される', () => {
      render(<ShopDetail shop={createMockShop({ tags: ['コーヒー', 'Wi-Fi'] })} />);

      const tagLinks = screen
        .getAllByRole('link')
        .filter(link => link.textContent?.startsWith('#'));
      expect(tagLinks.length).toBeGreaterThan(0);
    });

    test('説明文が表示される', () => {
      render(<ShopDetail shop={createMockShop()} />);

      expect(screen.getByText(/おしゃれなカフェです/)).toBeInTheDocument();
    });

    test('メニューがある場合表示される', () => {
      const shopWithMenu = createMockShop({
        menu: [
          { id: 'm1', name: 'ラテ', category: 'ドリンク', price: '¥500' },
          { id: 'm2', name: 'ケーキ', category: 'デザート', price: '¥600' },
        ],
      });

      render(<ShopDetail shop={shopWithMenu} />);

      expect(screen.getByText('ラテ')).toBeInTheDocument();
      expect(screen.getByText('ケーキ')).toBeInTheDocument();
    });

    test('メニューがない場合セクションが表示されない', () => {
      render(<ShopDetail shop={createMockShop({ menu: undefined })} />);

      expect(screen.queryByText('おすすめメニュー')).not.toBeInTheDocument();
    });
  });

  describe('画像ギャラリー', () => {
    test('複数画像で矢印ボタンが表示される', () => {
      const shopWithImages = createMockShop({
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      });

      render(<ShopDetail shop={shopWithImages} />);

      expect(screen.getByRole('button', { name: '前の画像へ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '次の画像へ' })).toBeInTheDocument();
    });

    test('単一画像で矢印ボタンが表示されない', () => {
      render(<ShopDetail shop={createMockShop({ imageUrls: undefined })} />);

      expect(screen.queryByRole('button', { name: '前の画像へ' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '次の画像へ' })).not.toBeInTheDocument();
    });

    test('次の画像へ移動できる', async () => {
      const user = userEvent.setup();
      const shopWithImages = createMockShop({
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      });

      render(<ShopDetail shop={shopWithImages} />);

      const nextButton = screen.getByRole('button', { name: '次の画像へ' });
      await user.click(nextButton);

      const img = screen.getByRole('img', { name: /テストカフェの写真 2\/2/ });
      expect(img).toBeInTheDocument();
    });

    test('前の画像へ移動できる (循環)', async () => {
      const user = userEvent.setup();
      const shopWithImages = createMockShop({
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
      });

      render(<ShopDetail shop={shopWithImages} />);

      const prevButton = screen.getByRole('button', { name: '前の画像へ' });
      await user.click(prevButton);

      // 最初の画像から前に行くと最後の画像になる
      const img = screen.getByRole('img', { name: /テストカフェの写真 2\/2/ });
      expect(img).toBeInTheDocument();
    });

    test('インジケーターで直接移動できる', async () => {
      const user = userEvent.setup();
      const shopWithImages = createMockShop({
        imageUrls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ],
      });

      render(<ShopDetail shop={shopWithImages} />);

      const indicators = screen.getAllByRole('button', { name: /番目の画像へ移動/ });
      expect(indicators.length).toBe(3);

      await user.click(indicators[2]);

      const img = screen.getByRole('img', { name: /テストカフェの写真 3\/3/ });
      expect(img).toBeInTheDocument();
    });
  });

  describe('お気に入り機能', () => {
    test('初期状態でお気に入りでない', () => {
      render(<ShopDetail shop={createMockShop()} />);

      expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
    });

    test('ボタンクリックでお気に入り追加', async () => {
      const user = userEvent.setup();
      render(<ShopDetail shop={createMockShop()} />);

      const favoriteButton = screen.getByRole('button', { name: /お気に入りに追加/ });
      await user.click(favoriteButton);

      expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
    });

    test('再クリックでお気に入り解除', async () => {
      const user = userEvent.setup();
      render(<ShopDetail shop={createMockShop()} />);

      const favoriteButton = screen.getByRole('button', { name: /お気に入りに追加/ });
      await user.click(favoriteButton);
      await user.click(screen.getByRole('button', { name: /お気に入り済み/ }));

      expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
    });

    test('localStorageに永続化される', async () => {
      const user = userEvent.setup();
      render(<ShopDetail shop={createMockShop()} />);

      const favoriteButton = screen.getByRole('button', { name: /お気に入りに追加/ });
      await user.click(favoriteButton);

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'shop-favorites',
          expect.stringContaining('test-shop-1'),
        );
      });
    });

    test('ページ読み込み時にlocalStorageから状態を復元する', () => {
      storageMock.setData({ 'shop-favorites': JSON.stringify(['test-shop-1']) });

      render(<ShopDetail shop={createMockShop()} />);

      expect(screen.getByText('お気に入り済み')).toBeInTheDocument();
    });
  });

  describe('共有機能', () => {
    test('navigator.share対応時にシェア実行', async () => {
      vi.useFakeTimers();
      const mockShare = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { share: mockShare, clipboard: undefined });

      render(<ShopDetail shop={createMockShop()} />);

      const shareButton = screen.getAllByRole('button', { name: /共有する|リンクを共有する/ })[0];
      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'テストカフェ',
        }),
      );
    });

    test('navigator.share未対応時にクリップボードコピー', async () => {
      vi.useFakeTimers();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        share: undefined,
        clipboard: { writeText: mockWriteText },
      });

      render(<ShopDetail shop={createMockShop()} />);

      const shareButton = screen.getAllByRole('button', { name: /共有する|リンクを共有する/ })[0];
      await act(async () => {
        fireEvent.click(shareButton);
      });

      expect(mockWriteText).toHaveBeenCalled();
    });

    test('成功メッセージが表示される', async () => {
      vi.useFakeTimers();
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        share: undefined,
        clipboard: { writeText: mockWriteText },
      });

      render(<ShopDetail shop={createMockShop()} />);

      const shareButton = screen.getAllByRole('button', { name: /共有する|リンクを共有する/ })[0];
      await act(async () => {
        fireEvent.click(shareButton);
      });
      expect(screen.getByText('リンクをコピーしました')).toBeInTheDocument();
    });

    test('エラー時にエラーメッセージが表示される', async () => {
      vi.useFakeTimers();
      const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
      vi.stubGlobal('navigator', { share: mockShare, clipboard: undefined });

      render(<ShopDetail shop={createMockShop()} />);

      const shareButton = screen.getAllByRole('button', { name: /共有する|リンクを共有する/ })[0];
      await act(async () => {
        fireEvent.click(shareButton);
      });
      expect(screen.getByText('共有に失敗しました')).toBeInTheDocument();
    });
  });

  describe('Googleマップリンク', () => {
    test('正しいマップURLが生成される', () => {
      render(<ShopDetail shop={createMockShop({ placeId: 'place-abc123', name: 'Test Cafe' })} />);

      const mapLink = screen.getByRole('link', { name: 'マップで開く' });
      // buildGoogleMapsUrl(placeId, shopName) で生成されるURL
      expect(mapLink).toHaveAttribute(
        'href',
        'https://www.google.com/maps/search/?api=1&query_place_id=place-abc123&query=Test+Cafe',
      );
    });

    test('新しいタブで開く', () => {
      render(<ShopDetail shop={createMockShop()} />);

      const mapLink = screen.getByRole('link', { name: 'マップで開く' });
      expect(mapLink).toHaveAttribute('target', '_blank');
    });
  });
});
