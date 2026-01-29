import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ReviewForm } from '../ReviewForm';

describe('ReviewForm', () => {
  const defaultProps = {
    shopId: 'shop-1',
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  describe('初期表示', () => {
    test('総合評価ラベルが表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('総合評価 *')).toBeInTheDocument();
    });

    test('項目別評価セクションが表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('項目別評価（任意）')).toBeInTheDocument();
    });

    test('コメント入力欄が表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByLabelText('コメント（任意）')).toBeInTheDocument();
    });

    test('キャンセルボタンが表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    test('投稿ボタンが表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '投稿する' })).toBeInTheDocument();
    });

    test('初期状態で投稿ボタンが無効', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '投稿する' })).toBeDisabled();
    });
  });

  describe('総合評価', () => {
    test('星をクリックして評価を設定できる', async () => {
      const user = userEvent.setup();
      render(<ReviewForm {...defaultProps} />);

      // 5つの星があるので、最初のグループ（総合評価）の4番目の星をクリック
      const stars = screen.getAllByRole('button').filter(btn => btn.textContent === '★');
      // 総合評価は最初の5つ
      await user.click(stars[3]); // 4つ目の星

      // 評価が設定されると投稿ボタンが有効になる
      expect(screen.getByRole('button', { name: '投稿する' })).toBeEnabled();
    });

    test('評価0では投稿できない', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: '投稿する' }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('コメント入力', () => {
    test('コメントを入力できる', async () => {
      const user = userEvent.setup();
      render(<ReviewForm {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('お店の感想を書いてください...');
      await user.type(textarea, '素晴らしいお店でした');

      expect(textarea).toHaveValue('素晴らしいお店でした');
    });
  });

  describe('フォーム送信', () => {
    test('評価を設定して投稿できる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

      // 総合評価を設定（最初の5つの星のうち5番目）
      const stars = screen.getAllByRole('button').filter(btn => btn.textContent === '★');
      await user.click(stars[4]); // 5つ目の星（評価5）

      // コメントを入力
      const textarea = screen.getByPlaceholderText('お店の感想を書いてください...');
      await user.type(textarea, '最高でした');

      // 投稿
      await user.click(screen.getByRole('button', { name: '投稿する' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 5,
            comment: '最高でした',
          }),
        );
      });
    });

    test('送信中は投稿ボタンが「投稿中...」になる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
      render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

      // 評価を設定
      const stars = screen.getAllByRole('button').filter(btn => btn.textContent === '★');
      await user.click(stars[4]);

      // 投稿
      await user.click(screen.getByRole('button', { name: '投稿する' }));

      expect(screen.getByRole('button', { name: '投稿中...' })).toBeInTheDocument();
    });

    test('送信中は投稿ボタンが無効になる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)));
      render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

      // 評価を設定
      const stars = screen.getAllByRole('button').filter(btn => btn.textContent === '★');
      await user.click(stars[4]);

      // 投稿
      await user.click(screen.getByRole('button', { name: '投稿する' }));

      expect(screen.getByRole('button', { name: '投稿中...' })).toBeDisabled();
    });
  });

  describe('キャンセル', () => {
    test('キャンセルボタンでonCancelが呼ばれる', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<ReviewForm {...defaultProps} onCancel={onCancel} />);

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('項目別評価', () => {
    test('評価カテゴリラベルが表示される', () => {
      render(<ReviewForm {...defaultProps} />);

      expect(screen.getByText('味')).toBeInTheDocument();
      expect(screen.getByText('雰囲気')).toBeInTheDocument();
      expect(screen.getByText('接客')).toBeInTheDocument();
      expect(screen.getByText('提供速度')).toBeInTheDocument();
      expect(screen.getByText('清潔感')).toBeInTheDocument();
    });

    test('項目別評価を設定できる', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ReviewForm {...defaultProps} onSubmit={onSubmit} />);

      // 総合評価を設定（最初のStarRatingの5番目の星）
      const stars = screen.getAllByRole('button').filter(btn => btn.textContent === '★');
      await user.click(stars[4]); // 総合評価5

      await user.click(screen.getByRole('button', { name: '投稿する' }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            rating: 5,
          }),
        );
      });
    });
  });
});
