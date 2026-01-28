import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  describe('基本表示', () => {
    test('タイトルが表示される', () => {
      render(<EmptyState title='データがありません' />);

      expect(screen.getByRole('heading', { name: 'データがありません' })).toBeInTheDocument();
    });

    test('説明文が表示される', () => {
      render(<EmptyState title='タイトル' description='詳細な説明文です' />);

      expect(screen.getByText('詳細な説明文です')).toBeInTheDocument();
    });

    test('説明文がない場合は表示されない', () => {
      render(<EmptyState title='タイトル' />);

      // descriptionがないことを確認
      const container = screen.getByRole('heading').parentElement;
      expect(container?.children).toHaveLength(1);
    });
  });

  describe('アクションボタン', () => {
    test('actionが指定されている場合ボタンが表示される', () => {
      render(<EmptyState title='タイトル' action={{ label: 'お店を探す', onClick: vi.fn() }} />);

      expect(screen.getByRole('button', { name: 'お店を探す' })).toBeInTheDocument();
    });

    test('ボタンクリックでonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<EmptyState title='タイトル' action={{ label: 'お店を探す', onClick }} />);

      await user.click(screen.getByRole('button', { name: 'お店を探す' }));

      expect(onClick).toHaveBeenCalled();
    });

    test('actionがない場合ボタンは表示されない', () => {
      render(<EmptyState title='タイトル' />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    test('loading=trueの場合「読み込み中...」が表示される', () => {
      render(<EmptyState title='タイトル' loading />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('loading=trueの場合タイトルは表示されない', () => {
      render(<EmptyState title='タイトル' loading />);

      expect(screen.queryByRole('heading', { name: 'タイトル' })).not.toBeInTheDocument();
    });

    test('loading=trueの場合アクションボタンは表示されない', () => {
      render(
        <EmptyState title='タイトル' action={{ label: 'お店を探す', onClick: vi.fn() }} loading />,
      );

      expect(screen.queryByRole('button', { name: 'お店を探す' })).not.toBeInTheDocument();
    });

    test('loading=falseの場合は通常表示', () => {
      render(<EmptyState title='タイトル' loading={false} />);

      expect(screen.getByRole('heading', { name: 'タイトル' })).toBeInTheDocument();
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });
});
