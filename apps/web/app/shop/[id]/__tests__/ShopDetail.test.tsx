import { TIMING } from '@team/constants';
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

  describe('基本情報の表示', () => {
    test('店舗名がヘッダーとサイドバーに表示される', () => {
      render(<ShopDetail shop={createMockShop()} />);

      // h1見出しで店舗名を確認
      expect(screen.getByRole('heading', { level: 1, name: 'テストカフェ' })).toBeInTheDocument();
      // サイドバーのh2見出しでも店舗名を確認
      expect(screen.getByRole('heading', { level: 2, name: 'テストカフェ' })).toBeInTheDocument();
    });

    test('評価が小数点1桁で表示される', () => {
      render(<ShopDetail shop={createMockShop({ rating: 4.567 })} />);

      // 評価は複数箇所に表示される（メイン + サイドバー）
      const ratingTexts = screen.getAllByText(/★\s*4\.6/);
      expect(ratingTexts).toHaveLength(2);
    });

    test('予算ラベルが正しく変換される', () => {
      render(<ShopDetail shop={createMockShop({ budget: '$$$' })} />);

      // 予算は複数箇所に表示される（画像オーバーレイ + メイン + サイドバー）
      const budgetTexts = screen.getAllByText(/¥¥¥/);
      expect(budgetTexts).toHaveLength(3);
    });

    test('説明文が表示される', () => {
      render(<ShopDetail shop={createMockShop()} />);

      expect(screen.getByText(/おしゃれなカフェです/)).toBeInTheDocument();
    });

    test('カテゴリが表示される', () => {
      render(<ShopDetail shop={createMockShop({ category: 'レストラン' })} />);

      expect(screen.getByText('レストラン')).toBeInTheDocument();
    });

    test('徒歩分数が表示される', () => {
      render(<ShopDetail shop={createMockShop({ distanceMinutes: 5 })} />);

      // 徒歩5分が複数箇所に表示される
      const distanceTexts = screen.getAllByText(/徒歩5分/);
      expect(distanceTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('タグの表示', () => {
    test('タグがリンクとして表示される', () => {
      render(<ShopDetail shop={createMockShop({ tags: ['コーヒー', 'Wi-Fi'] })} />);

      expect(screen.getByRole('link', { name: '#コーヒー' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '#Wi-Fi' })).toBeInTheDocument();
    });

    test('タグリンクは検索ページへ遷移する', () => {
      render(<ShopDetail shop={createMockShop({ tags: ['コーヒー'] })} />);

      const tagLink = screen.getByRole('link', { name: '#コーヒー' });
      expect(tagLink).toHaveAttribute('href', '/?q=%E3%82%B3%E3%83%BC%E3%83%92%E3%83%BC');
    });

    test('タグが空配列の場合はタグセクションが表示されない', () => {
      render(<ShopDetail shop={createMockShop({ tags: [] })} />);

      // タグリンクが存在しないことを確認
      const tagLinks = screen
        .queryAllByRole('link')
        .filter(link => link.textContent?.startsWith('#'));
      expect(tagLinks).toHaveLength(0);
    });
  });

  describe('メニューの表示', () => {
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

    test('メニューがundefinedの場合セクションが表示されない', () => {
      render(<ShopDetail shop={createMockShop({ menu: undefined })} />);

      expect(screen.queryByText('おすすめメニュー')).not.toBeInTheDocument();
    });

    test('メニューが空配列の場合セクションが表示されない', () => {
      render(<ShopDetail shop={createMockShop({ menu: [] })} />);

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

    test('前の画像へ移動できる（循環）', async () => {
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
      expect(indicators).toHaveLength(3);

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
      // 事前にお気に入り状態を設定
      storageMock.setData({ 'shop-favorites': JSON.stringify(['test-shop-1']) });

      const user = userEvent.setup();
      render(<ShopDetail shop={createMockShop()} />);

      // すでにお気に入り済み状態
      expect(screen.getByText('お気に入り済み')).toBeInTheDocument();

      // クリックして解除
      const favoriteButton = screen.getByRole('button', { name: /お気に入り済み/ });
      await user.click(favoriteButton);

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

    test('localStorageに不正なJSONがある場合はデフォルト値が使用される', () => {
      storageMock.setData({ 'shop-favorites': '{invalid json' });

      // エラーにならずレンダリングされる
      render(<ShopDetail shop={createMockShop()} />);

      // デフォルト値（空配列）が使用されるため、お気に入りでない状態
      expect(screen.getByText('お気に入りに追加')).toBeInTheDocument();
    });
  });

  describe('共有機能', () => {
    test('シェアボタンクリックで共有ダイアログが表示される', async () => {
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
          text: expect.stringContaining('テストカフェ'),
          url: expect.any(String),
        }),
      );
    });

    test('シェア未対応ブラウザでリンクがクリップボードにコピーされる', async () => {
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

      // 実際のURLがコピーされることを検証
      expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('localhost'));
    });

    test('共有成功時にメッセージが表示される', async () => {
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

    test('共有成功メッセージが一定時間後に消える', async () => {
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

      // TOAST_DURATION経過後にメッセージが消える
      act(() => {
        vi.advanceTimersByTime(TIMING.TOAST_DURATION + 100);
      });

      expect(screen.queryByText('リンクをコピーしました')).not.toBeInTheDocument();
    });

    test('共有エラー時にエラーメッセージが表示される', async () => {
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

    test('placeIdがundefinedでもマップリンクが機能する', () => {
      render(<ShopDetail shop={createMockShop({ placeId: undefined, name: 'テストカフェ' })} />);

      const mapLink = screen.getByRole('link', { name: 'マップで開く' });
      // placeIdがない場合は店舗名のみで検索
      expect(mapLink).toHaveAttribute('href', expect.stringContaining('query='));
    });
  });
});
