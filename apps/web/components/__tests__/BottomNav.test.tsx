import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { nextLinkMock } from '../../test-utils';
import { BottomNav } from '../BottomNav';

vi.mock('next/link', () => nextLinkMock);

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  describe('ナビゲーションリンク', () => {
    test('ホームリンクが表示される', () => {
      render(<BottomNav />);

      expect(screen.getByRole('link', { name: /ホーム/ })).toBeInTheDocument();
    });

    test('お気に入りリンクが表示される', () => {
      render(<BottomNav />);

      expect(screen.getByRole('link', { name: /お気に入り/ })).toBeInTheDocument();
    });

    test('マイページリンクが表示される', () => {
      render(<BottomNav />);

      expect(screen.getByRole('link', { name: /マイページ/ })).toBeInTheDocument();
    });

    test('各リンクが正しいhrefを持つ', () => {
      render(<BottomNav />);

      expect(screen.getByRole('link', { name: /ホーム/ })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /お気に入り/ })).toHaveAttribute(
        'href',
        '/favorites',
      );
      expect(screen.getByRole('link', { name: /マイページ/ })).toHaveAttribute('href', '/mypage');
    });
  });

  describe('アイコン表示', () => {
    test('各リンクにSVGアイコンが含まれる', () => {
      render(<BottomNav />);

      const links = screen.getAllByRole('link');
      for (const link of links) {
        expect(link.querySelector('svg')).toBeInTheDocument();
      }
    });
  });

  describe('アクティブ状態', () => {
    test('ホームパスでホームリンクがアクティブスタイルを持つ', () => {
      mockUsePathname.mockReturnValue('/');
      render(<BottomNav />);

      const homeLink = screen.getByRole('link', { name: /ホーム/ });
      expect(homeLink).toHaveClass('text-slate-900');
    });

    test('他のパスでは非アクティブスタイルを持つ', () => {
      mockUsePathname.mockReturnValue('/favorites');
      render(<BottomNav />);

      const homeLink = screen.getByRole('link', { name: /ホーム/ });
      expect(homeLink).toHaveClass('text-slate-400');

      const favoritesLink = screen.getByRole('link', { name: /お気に入り/ });
      expect(favoritesLink).toHaveClass('text-slate-900');

      const mypageLink = screen.getByRole('link', { name: /マイページ/ });
      expect(mypageLink).toHaveClass('text-slate-400');
    });
  });

  describe('ラベル表示', () => {
    test('各ナビゲーション項目にラベルテキストが表示される', () => {
      render(<BottomNav />);

      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('お気に入り')).toBeInTheDocument();
      expect(screen.getByText('マイページ')).toBeInTheDocument();
    });
  });
});
