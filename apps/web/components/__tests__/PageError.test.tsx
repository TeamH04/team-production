import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { PageError } from '../PageError';

describe('PageError', () => {
  describe('メッセージ表示', () => {
    test('デフォルトエラーメッセージが表示される', () => {
      render(<PageError />);

      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    });

    test('カスタムエラーメッセージを設定できる', () => {
      render(<PageError message='接続エラーが発生しました' />);

      expect(screen.getByText('接続エラーが発生しました')).toBeInTheDocument();
    });
  });

  describe('再試行ボタン', () => {
    test('onRetryがない場合ボタンは表示されない', () => {
      render(<PageError />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('onRetryがある場合再試行ボタンが表示される', () => {
      render(<PageError onRetry={vi.fn()} />);

      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
    });

    test('ボタンクリックでonRetryが呼ばれる', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<PageError onRetry={onRetry} />);

      await user.click(screen.getByRole('button', { name: '再試行' }));

      expect(onRetry).toHaveBeenCalled();
    });

    test('カスタムラベルを設定できる', () => {
      render(<PageError onRetry={vi.fn()} retryLabel='もう一度試す' />);

      expect(screen.getByRole('button', { name: 'もう一度試す' })).toBeInTheDocument();
    });
  });
});
