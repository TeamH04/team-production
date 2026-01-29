import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { SortSelector } from '../SortSelector';

const TEST_OPTIONS = [
  { label: '新着順', value: 'newest' },
  { label: '評価順', value: 'rating' },
  { label: '距離順', value: 'distance' },
] as const;

describe('SortSelector', () => {
  describe('基本表示', () => {
    test('すべてのオプションがボタンとして表示される', () => {
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: '新着順' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '評価順' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '距離順' })).toBeInTheDocument();
    });

    test('選択中のオプションはaria-pressed=trueが設定される', () => {
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: '新着順' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    test('非選択のオプションはaria-pressed=falseが設定される', () => {
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: '評価順' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('選択操作', () => {
    test('オプションをクリックするとonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: '評価順' }));

      expect(onChange).toHaveBeenCalledWith('rating');
    });

    test('別のオプションをクリックすると対応する値でonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: '距離順' }));

      expect(onChange).toHaveBeenCalledWith('distance');
    });

    test('選択中のオプションをクリックしてもonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<SortSelector options={TEST_OPTIONS} value='newest' onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: '新着順' }));

      expect(onChange).toHaveBeenCalledWith('newest');
    });
  });

  describe('ジェネリック型', () => {
    test('文字列以外の値でも正しく動作する', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const numericOptions = [
        { label: '1件', value: '1' },
        { label: '10件', value: '10' },
        { label: '100件', value: '100' },
      ] as const;

      render(<SortSelector options={numericOptions} value='10' onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: '100件' }));

      expect(onChange).toHaveBeenCalledWith('100');
    });
  });
});
