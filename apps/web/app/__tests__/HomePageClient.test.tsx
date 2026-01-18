import { TIMING } from '@team/constants';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { nextImageMock } from '../../test-utils';
import HomePageClient from '../HomePageClient';

import type * as ShopCoreModule from '@team/shop-core';

// vi.mock はホイスティングされるため、ファクトリ内で vi.importActual を使用
vi.mock('@team/shop-core', async importOriginal => {
  const actual = (await importOriginal()) as typeof ShopCoreModule;
  // TEST_SHOPS, TEST_CATEGORIES は別途インポートするとホイスティング問題が発生するため
  // ここでインライン定義する必要がある
  const { createMockShop } = await import('@team/test-utils');
  const testShops = [
    createMockShop({ id: 'shop-1', name: 'テストカフェ1', tags: ['コーヒー', 'Wi-Fi'] }),
    createMockShop({ id: 'shop-2', name: 'テストカフェ2', tags: ['紅茶'] }),
    createMockShop({
      id: 'shop-3',
      name: 'テストレストラン',
      category: 'レストラン',
      tags: ['豚骨', '深夜営業'],
    }),
    createMockShop({
      id: 'shop-4',
      name: 'テストバー',
      category: 'バー・居酒屋',
      tags: ['カクテル'],
    }),
    // 多様なテストデータ（タグ数、カテゴリ、評価のバリエーション）
    createMockShop({
      id: 'shop-5',
      name: '店舗5',
      tags: ['静か', 'Wi-Fi', '電源あり', '作業向け'],
      rating: 4.8,
    }),
    createMockShop({
      id: 'shop-6',
      name: '店舗6',
      category: 'レストラン',
      tags: ['ランチ', 'テイクアウト'],
      rating: 3.5,
    }),
    createMockShop({
      id: 'shop-7',
      name: '店舗7',
      category: 'バー・居酒屋',
      tags: ['飲み放題'],
      budget: '$$$',
    }),
    createMockShop({ id: 'shop-8', name: '店舗8', tags: ['ペット可', '禁煙'], rating: 4.2 }),
    createMockShop({ id: 'shop-9', name: '店舗9', tags: ['個室あり'], budget: '$$' }),
    createMockShop({ id: 'shop-10', name: '店舗10', tags: ['駐車場あり', '子連れ歓迎'] }),
  ];
  const testCategories = ['カフェ・喫茶', 'レストラン', 'バー・居酒屋'] as const;
  return {
    ...actual,
    SHOPS: testShops,
    CATEGORIES: testCategories,
  };
});

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

vi.mock('next/image', () => nextImageMock);

describe('HomePageClient', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  afterEach(() => {
    if (vi.isFakeTimers()) {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  describe('初期表示', () => {
    test('ヘッダーとフィルターセクションが表示される', () => {
      render(<HomePageClient />);

      expect(
        screen.getByRole('heading', { name: /次に通いたくなるお店を見つけよう/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /店舗を検索/i })).toBeInTheDocument();
    });

    test('検索結果件数が表示される', () => {
      render(<HomePageClient />);

      expect(screen.getByText(/検索結果.*件/)).toBeInTheDocument();
    });

    test('カテゴリフィルターボタンが表示される', () => {
      render(<HomePageClient />);

      expect(screen.getByRole('button', { name: 'すべて' })).toBeInTheDocument();
    });

    test('検索入力欄が表示される', () => {
      render(<HomePageClient />);

      expect(screen.getByPlaceholderText('お店名・雰囲気・タグで検索')).toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    test('検索テキストを入力できる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      await user.type(input, 'カフェ');

      expect(input).toHaveValue('カフェ');
    });

    test('クリアボタンで検索テキストをリセットできる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      await user.type(input, 'テスト');

      const clearButton = screen.getByRole('button', { name: 'クリア' });
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });

    test('検索結果が0件の場合メッセージが表示される', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      await user.type(input, '存在しない店舗名');

      await waitFor(() => {
        expect(screen.getByText('条件に合うお店が見つかりません')).toBeInTheDocument();
      });
    });

    test('検索後にURLパラメータが正しく更新される', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      fireEvent.change(input, { target: { value: 'テスト' } });

      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('q=%E3%83%86%E3%82%B9%E3%83%88'),
        expect.objectContaining({ scroll: false }),
      );
    });

    test('空白のみの検索はURLパラメータを更新しない', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      fireEvent.change(input, { target: { value: '   ' } });

      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      // 空白のみの場合はpathnameのみ（クエリパラメータなし）
      expect(mockReplace).toHaveBeenCalledWith('/', expect.objectContaining({ scroll: false }));
    });

    test('特殊文字を含む検索クエリが正しくエンコードされる', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      fireEvent.change(input, { target: { value: 'カフェ&バー' } });

      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      // &が%26にエンコードされることを確認
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('%26'),
        expect.objectContaining({ scroll: false }),
      );
    });

    test('連続した検索入力で最後の値のみがURLに反映される', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');

      // 連続して入力
      fireEvent.change(input, { target: { value: 'あ' } });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      fireEvent.change(input, { target: { value: 'あい' } });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      fireEvent.change(input, { target: { value: 'あいう' } });

      // デバウンス時間経過
      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      // 最後の値のみで呼ばれる
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('%E3%81%82%E3%81%84%E3%81%86'),
        expect.anything(),
      );
    });
  });

  describe('カテゴリフィルター', () => {
    test('カテゴリを選択するとボタンの選択状態が変わる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const allButton = screen.getByRole('button', { name: 'すべて' });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');

      // TEST_CATEGORIESでモックしているので「カフェ・喫茶」ボタンが必ず存在する
      const cafeButton = screen.getByRole('button', { name: 'カフェ・喫茶' });
      expect(cafeButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(cafeButton);

      expect(cafeButton).toHaveAttribute('aria-pressed', 'true');
      expect(allButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('選択中のカテゴリを再クリックで解除できる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const cafeButton = screen.getByRole('button', { name: 'カフェ・喫茶' });
      const allButton = screen.getByRole('button', { name: 'すべて' });

      // カテゴリを選択
      await user.click(cafeButton);
      expect(cafeButton).toHaveAttribute('aria-pressed', 'true');

      // 同じカテゴリを再クリックして解除
      await user.click(cafeButton);
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
      expect(cafeButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('カテゴリ選択で表示店舗がフィルタリングされる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      // レストランカテゴリを選択
      const restaurantButton = screen.getByRole('button', { name: 'レストラン' });
      await user.click(restaurantButton);

      // レストラン店舗のみ表示される（TEST_SHOPSで2件定義: shop-3, shop-6）
      expect(screen.getByText('検索結果 2 件')).toBeInTheDocument();
      expect(screen.getByText('テストレストラン')).toBeInTheDocument();
    });
  });

  describe('ページネーション', () => {
    test('10件の店舗があるとき「もっと見る」ボタンが表示される', () => {
      // TEST_SHOPSで10件定義、PAGE_SIZE=9なので「もっと見る」が表示される
      render(<HomePageClient />);

      const loadMoreButton = screen.getByRole('button', { name: 'もっと見る' });
      expect(loadMoreButton).toBeInTheDocument();
    });

    test('もっと見るボタンをクリックすると残りの店舗が表示される', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      // 初期状態: 9件表示（PAGE_SIZE=9）
      expect(screen.getByText('検索結果 10 件')).toBeInTheDocument();
      const initialShopCards = screen
        .getAllByRole('link')
        .filter(link => link.getAttribute('href')?.startsWith('/shop/'));
      expect(initialShopCards).toHaveLength(9);

      // もっと見るをクリック
      const loadMoreButton = screen.getByRole('button', { name: 'もっと見る' });
      await user.click(loadMoreButton);

      // 残りの1件が表示される（合計10件）
      const afterShopCards = screen
        .getAllByRole('link')
        .filter(link => link.getAttribute('href')?.startsWith('/shop/'));
      expect(afterShopCards).toHaveLength(10);

      // 全件表示後は「もっと見る」ボタンが消える
      expect(screen.queryByRole('button', { name: 'もっと見る' })).not.toBeInTheDocument();
    });

    test('検索条件変更でページネーションがリセットされる', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const getShopCards = () =>
        screen.getAllByRole('link').filter(link => link.getAttribute('href')?.startsWith('/shop/'));

      fireEvent.click(screen.getByRole('button', { name: 'もっと見る' }));
      expect(getShopCards()).toHaveLength(10);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      fireEvent.change(input, { target: { value: 'テストレストラン' } });

      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      expect(getShopCards()).toHaveLength(1);

      fireEvent.change(input, { target: { value: '' } });
      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      expect(getShopCards()).toHaveLength(9);
      expect(screen.getByRole('button', { name: 'もっと見る' })).toBeInTheDocument();
    });
  });

  describe('タグクリック', () => {
    test('タグボタンをクリックすると検索テキストが設定される', async () => {
      render(<HomePageClient />);

      // TEST_SHOPSの最初の店舗には「コーヒー」タグがある
      const coffeeTagButton = screen.getByRole('button', { name: '#コーヒー' });
      fireEvent.click(coffeeTagButton);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      await waitFor(() => {
        expect(input).toHaveValue('コーヒー');
      });
    });

    test('タグクリック後はカテゴリがすべてにリセットされる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      // まずカテゴリを選択
      const restaurantButton = screen.getByRole('button', { name: 'レストラン' });
      await user.click(restaurantButton);
      expect(restaurantButton).toHaveAttribute('aria-pressed', 'true');

      // タグをクリック
      const tagButton = screen.getByRole('button', { name: '#豚骨' });
      fireEvent.click(tagButton);

      // カテゴリが「すべて」にリセットされる
      const allButton = screen.getByRole('button', { name: 'すべて' });
      expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('4つ以上のタグがある店舗で+N表示される', () => {
      render(<HomePageClient />);

      // shop-5は4つのタグを持つ（'静か', 'Wi-Fi', '電源あり', '作業向け'）
      // 最初の3つが表示され、+1が表示される
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('IME対応', () => {
    test('compositionStart中はURL更新しない', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');

      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'あいう' } });

      // デバウンス時間を超えても更新されない
      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH + 50);
      });
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test('compositionEnd後にURL更新される', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');

      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'テスト' } });
      fireEvent.compositionEnd(input, { currentTarget: { value: 'テスト' } } as never);

      act(() => {
        vi.advanceTimersByTime(TIMING.DEBOUNCE_SEARCH);
      });

      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining('q=%E3%83%86%E3%82%B9%E3%83%88'),
        expect.objectContaining({ scroll: false }),
      );
    });
  });
});
