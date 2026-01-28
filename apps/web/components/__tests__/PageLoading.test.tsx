import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { PageLoading } from '../PageLoading';

describe('PageLoading', () => {
  describe('表示', () => {
    test('デフォルトメッセージが表示される', () => {
      render(<PageLoading />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    test('カスタムメッセージを設定できる', () => {
      render(<PageLoading message='データを取得中...' />);

      expect(screen.getByText('データを取得中...')).toBeInTheDocument();
    });

    test('別のカスタムメッセージを設定できる', () => {
      render(<PageLoading message='しばらくお待ちください' />);

      expect(screen.getByText('しばらくお待ちください')).toBeInTheDocument();
    });
  });
});
