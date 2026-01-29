import { createMockReviewWithUser } from '@team/test-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ReviewCard } from '../ReviewCard';

describe('ReviewCard', () => {
  describe('基本表示', () => {
    test('ユーザー名が表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ userName: '田中さん' })} />);

      expect(screen.getByText('田中さん')).toBeInTheDocument();
    });

    test('ユーザー名の頭文字がアバターに表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ userName: '田中さん' })} />);

      expect(screen.getByText('田')).toBeInTheDocument();
    });

    test('評価が表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ rating: 4.5 })} />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    test('コメントが表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ comment: '素晴らしいお店でした' })} />);

      expect(screen.getByText('素晴らしいお店でした')).toBeInTheDocument();
    });

    test('コメントがない場合は表示されない', () => {
      render(<ReviewCard review={createMockReviewWithUser({ comment: undefined })} />);

      // コメント領域が存在しないことを確認
      const reviewCard = screen.getByText('田中さん').closest('div');
      expect(reviewCard).not.toHaveTextContent('undefined');
    });

    test('作成日が日本語形式で表示される', () => {
      render(
        <ReviewCard review={createMockReviewWithUser({ createdAt: '2025-01-15T09:00:00.000Z' })} />,
      );

      expect(screen.getByText(/2025/)).toBeInTheDocument();
    });
  });

  describe('評価詳細バッジ', () => {
    test('評価詳細がバッジとして表示される', () => {
      render(
        <ReviewCard
          review={createMockReviewWithUser({
            ratingDetails: { taste: 5, atmosphere: 4, service: 3, speed: 2, cleanliness: 1 },
          })}
        />,
      );

      // 各評価項目のバッジが表示される（日本語ラベル）
      expect(screen.getByText('味')).toBeInTheDocument();
      expect(screen.getByText('雰囲気')).toBeInTheDocument();
    });

    test('評価詳細がない場合はバッジが表示されない', () => {
      render(<ReviewCard review={createMockReviewWithUser({ ratingDetails: undefined })} />);

      // 評価バッジが存在しないことを確認
      expect(screen.queryByText('味')).not.toBeInTheDocument();
    });
  });

  describe('いいね機能', () => {
    test('いいね数が表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ likesCount: 5 })} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('likedByMe=falseの場合は白抜きハートが表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ likedByMe: false })} />);

      expect(screen.getByText('♡')).toBeInTheDocument();
    });

    test('likedByMe=trueの場合は塗りつぶしハートが表示される', () => {
      render(<ReviewCard review={createMockReviewWithUser({ likedByMe: true })} />);

      expect(screen.getByText('♥')).toBeInTheDocument();
    });

    test('いいねボタンクリックでonLikeToggleが呼ばれる', async () => {
      const user = userEvent.setup();
      const onLikeToggle = vi.fn();
      render(<ReviewCard review={createMockReviewWithUser()} onLikeToggle={onLikeToggle} />);

      const likeButton = screen.getByRole('button');
      await user.click(likeButton);

      expect(onLikeToggle).toHaveBeenCalled();
    });

    test('onLikeToggleがない場合でもクリックでエラーにならない', async () => {
      const user = userEvent.setup();
      render(<ReviewCard review={createMockReviewWithUser()} />);

      const likeButton = screen.getByRole('button');
      // エラーが発生しないことを確認
      await expect(user.click(likeButton)).resolves.not.toThrow();
    });
  });
});
