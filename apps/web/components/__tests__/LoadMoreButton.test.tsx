import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { LoadMoreButton } from '../LoadMoreButton';

describe('LoadMoreButton', () => {
  describe('表示制御', () => {
    test('visible=trueの場合ボタンが表示される', () => {
      render(<LoadMoreButton onClick={vi.fn()} visible />);

      expect(screen.getByRole('button', { name: 'もっと見る' })).toBeInTheDocument();
    });

    test('visible=falseの場合ボタンが表示されない', () => {
      render(<LoadMoreButton onClick={vi.fn()} visible={false} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('visibleのデフォルト値はtrue', () => {
      render(<LoadMoreButton onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'もっと見る' })).toBeInTheDocument();
    });
  });

  describe('ラベル', () => {
    test('デフォルトラベルは「もっと見る」', () => {
      render(<LoadMoreButton onClick={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'もっと見る' })).toBeInTheDocument();
    });

    test('カスタムラベルを設定できる', () => {
      render(<LoadMoreButton onClick={vi.fn()} label='さらに読み込む' />);

      expect(screen.getByRole('button', { name: 'さらに読み込む' })).toBeInTheDocument();
    });
  });

  describe('クリック動作', () => {
    test('クリックでonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<LoadMoreButton onClick={onClick} />);

      await user.click(screen.getByRole('button', { name: 'もっと見る' }));

      expect(onClick).toHaveBeenCalled();
    });

    test('複数回クリックで複数回onClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<LoadMoreButton onClick={onClick} />);

      const button = screen.getByRole('button', { name: 'もっと見る' });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });
});
