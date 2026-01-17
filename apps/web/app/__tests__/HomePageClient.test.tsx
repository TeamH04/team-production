import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { nextImageMock } from '../../test-utils';
import { shopCoreMock } from '../../test-utils/shop-core-mock';
import HomePageClient from '../HomePageClient';

// shopCoreMock を使用して @team/shop-core をモック
// データ定義は test-utils/shop-core-mock.ts に集約
vi.mock('@team/shop-core', () => shopCoreMock);

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
      await user.type(input, 'xxxxxxxxxxxxxxxxxxxxxxx');

      await waitFor(() => {
        expect(screen.getByText('条件に合うお店が見つかりません')).toBeInTheDocument();
      });
    });

    test('検索後にURLパラメータが更新される', async () => {
      vi.useFakeTimers();
      render(<HomePageClient />);

      const input = screen.getByPlaceholderText('お店名・雰囲気・タグで検索');
      fireEvent.change(input, { target: { value: 'テスト' } });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(mockReplace).toHaveBeenCalled();
    });
  });

  describe('カテゴリフィルター', () => {
    test('カテゴリを選択するとボタンスタイルが変わる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const allButton = screen.getByRole('button', { name: 'すべて' });
      expect(allButton).toHaveClass('bg-slate-900');

      // TEST_CATEGORIESでモックしているので「カフェ・喫茶」ボタンが必ず存在する
      const cafeButton = screen.getByRole('button', { name: 'カフェ・喫茶' });
      await user.click(cafeButton);
      expect(cafeButton).toHaveClass('bg-slate-900');
      expect(allButton).not.toHaveClass('bg-slate-900');
    });

    test('選択中のカテゴリを再クリックで解除できる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      const cafeButton = screen.getByRole('button', { name: 'カフェ・喫茶' });
      const allButton = screen.getByRole('button', { name: 'すべて' });

      // カテゴリを選択
      await user.click(cafeButton);
      expect(cafeButton).toHaveClass('bg-slate-900');

      // 同じカテゴリを再クリックして解除
      await user.click(cafeButton);
      expect(allButton).toHaveClass('bg-slate-900');
      expect(cafeButton).not.toHaveClass('bg-slate-900');
    });

    test('カテゴリ選択で表示店舗がフィルタリングされる', async () => {
      const user = userEvent.setup();
      render(<HomePageClient />);

      // レストランカテゴリを選択
      const ramenButton = screen.getByRole('button', { name: 'レストラン' });
      await user.click(ramenButton);

      // レストラン店舗のみ表示される（TEST_SHOPSで1件定義）
      expect(screen.getByText('検索結果 1 件')).toBeInTheDocument();
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
        vi.advanceTimersByTime(200);
      });

      expect(getShopCards()).toHaveLength(1);

      fireEvent.change(input, { target: { value: '' } });
      act(() => {
        vi.advanceTimersByTime(200);
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
      const ramenButton = screen.getByRole('button', { name: 'レストラン' });
      await user.click(ramenButton);
      expect(ramenButton).toHaveClass('bg-slate-900');

      // タグをクリック
      const tagButton = screen.getByRole('button', { name: '#豚骨' });
      fireEvent.click(tagButton);

      // カテゴリが「すべて」にリセットされる
      const allButton = screen.getByRole('button', { name: 'すべて' });
      expect(allButton).toHaveClass('bg-slate-900');
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
        vi.advanceTimersByTime(250);
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
        vi.advanceTimersByTime(200);
      });

      expect(mockReplace).toHaveBeenCalled();
    });
  });
});
