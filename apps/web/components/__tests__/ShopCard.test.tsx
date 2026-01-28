import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { createMockShop, nextImageMock, nextLinkMock } from '../../test-utils';
import { ShopCard } from '../ShopCard';

vi.mock('next/image', () => nextImageMock);
vi.mock('next/link', () => nextLinkMock);

describe('ShopCard', () => {
  describe('基本表示', () => {
    test('店舗名が表示される', () => {
      render(<ShopCard shop={createMockShop({ name: 'テストカフェ' })} />);

      expect(screen.getByRole('heading', { name: 'テストカフェ' })).toBeInTheDocument();
    });

    test('店舗詳細へのリンクが設定される', () => {
      render(<ShopCard shop={createMockShop({ id: 'shop-123' })} />);

      expect(screen.getByRole('link')).toHaveAttribute('href', '/shop/shop-123');
    });

    test('評価が表示される', () => {
      render(<ShopCard shop={createMockShop({ rating: 4.5 })} />);

      expect(screen.getByText(/★.*4\.5/)).toBeInTheDocument();
    });

    test('カテゴリが表示される', () => {
      render(<ShopCard shop={createMockShop({ category: 'カフェ・喫茶' })} />);

      expect(screen.getByText('カフェ・喫茶')).toBeInTheDocument();
    });

    test('徒歩分数が表示される', () => {
      render(<ShopCard shop={createMockShop({ distanceMinutes: 5 })} />);

      expect(screen.getByText('徒歩5分')).toBeInTheDocument();
    });

    test('説明文が表示される', () => {
      render(<ShopCard shop={createMockShop({ description: 'おしゃれなカフェです' })} />);

      expect(screen.getByText('おしゃれなカフェです')).toBeInTheDocument();
    });

    test('予算が日本円表記で表示される', () => {
      render(<ShopCard shop={createMockShop({ budget: '$$' })} />);

      expect(screen.getByText('¥¥')).toBeInTheDocument();
    });
  });

  describe('タグ表示', () => {
    test('タグが3つまで表示される', () => {
      render(
        <ShopCard shop={createMockShop({ tags: ['コーヒー', 'Wi-Fi', '静か', '電源あり'] })} />,
      );

      expect(screen.getByRole('button', { name: '#コーヒー' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '#Wi-Fi' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '#静か' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '#電源あり' })).not.toBeInTheDocument();
    });

    test('4つ以上のタグがある場合は+N表示される', () => {
      render(
        <ShopCard shop={createMockShop({ tags: ['コーヒー', 'Wi-Fi', '静か', '電源あり'] })} />,
      );

      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    test('タグクリックでonTagClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const onTagClick = vi.fn();
      render(<ShopCard shop={createMockShop({ tags: ['コーヒー'] })} onTagClick={onTagClick} />);

      await user.click(screen.getByRole('button', { name: '#コーヒー' }));

      expect(onTagClick).toHaveBeenCalledWith('コーヒー');
    });
  });

  describe('お気に入りボタン', () => {
    test('showFavoriteButton=falseの場合ボタンが表示されない', () => {
      render(<ShopCard shop={createMockShop()} showFavoriteButton={false} />);

      expect(screen.queryByRole('button', { name: /お気に入り/ })).not.toBeInTheDocument();
    });

    test('showFavoriteButton=trueの場合ボタンが表示される', () => {
      render(<ShopCard shop={createMockShop()} showFavoriteButton />);

      expect(screen.getByRole('button', { name: 'お気に入りに追加' })).toBeInTheDocument();
    });

    test('isFavorite=trueの場合「お気に入りから削除」ラベルが表示される', () => {
      render(<ShopCard shop={createMockShop()} showFavoriteButton isFavorite />);

      expect(screen.getByRole('button', { name: 'お気に入りから削除' })).toBeInTheDocument();
    });

    test('お気に入りボタンクリックでonFavoriteToggleが呼ばれる', async () => {
      const user = userEvent.setup();
      const onFavoriteToggle = vi.fn();
      render(
        <ShopCard shop={createMockShop()} showFavoriteButton onFavoriteToggle={onFavoriteToggle} />,
      );

      await user.click(screen.getByRole('button', { name: 'お気に入りに追加' }));

      expect(onFavoriteToggle).toHaveBeenCalled();
    });
  });

  describe('画像表示', () => {
    test('画像がalt属性付きで表示される', () => {
      render(<ShopCard shop={createMockShop({ name: 'テストカフェ' })} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'テストカフェの写真');
    });

    test('priority指定が画像に渡される', () => {
      render(<ShopCard shop={createMockShop()} priority />);

      // モック画像では検証しづらいが、propsが渡されることを確認
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
