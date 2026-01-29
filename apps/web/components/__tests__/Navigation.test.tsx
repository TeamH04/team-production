import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { nextLinkMock } from '../../test-utils';
import { Navigation } from '../Navigation';

vi.mock('next/link', () => nextLinkMock);

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  describe('ロゴ', () => {
    test('ロゴが表示される', () => {
      render(<Navigation />);

      expect(screen.getByAltText('Kuguriロゴ')).toBeInTheDocument();
    });

    test('ロゴはホームへのリンク', () => {
      render(<Navigation />);

      const logo = screen.getByAltText('Kuguriロゴ');
      expect(logo.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('ナビゲーションリンク', () => {
    test('ホームリンクが表示される', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    });

    test('お気に入りリンクが表示される', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'お気に入り' })).toBeInTheDocument();
    });

    test('マイページリンクが表示される', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'マイページ' })).toBeInTheDocument();
    });

    test('ホームリンクが正しいhrefを持つ', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute('href', '/');
    });

    test('お気に入りリンクが正しいhrefを持つ', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'お気に入り' })).toHaveAttribute(
        'href',
        '/favorites',
      );
    });

    test('マイページリンクが正しいhrefを持つ', () => {
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'マイページ' })).toHaveAttribute('href', '/mypage');
    });
  });

  describe('アクティブ状態', () => {
    test('ホームパスでホームリンクがレンダリングされる', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
    });

    test('お気に入りパスでお気に入りリンクがレンダリングされる', () => {
      mockUsePathname.mockReturnValue('/favorites');
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'お気に入り' })).toBeInTheDocument();
    });

    test('マイページパスでマイページリンクがレンダリングされる', () => {
      mockUsePathname.mockReturnValue('/mypage');
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'マイページ' })).toBeInTheDocument();
    });

    test('全てのナビゲーションリンクが表示される', () => {
      mockUsePathname.mockReturnValue('/');
      render(<Navigation />);

      expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'お気に入り' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'マイページ' })).toBeInTheDocument();
    });
  });
});
