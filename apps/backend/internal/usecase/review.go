package usecase

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// ReviewUseCase はレビューに関するビジネスロジックを提供します
type ReviewUseCase interface {
	GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	CreateReview(ctx context.Context, storeID int64, userID string, input input.CreateReviewInput) (*domain.Review, error)
}

type reviewUseCase struct {
	reviewRepo output.ReviewRepository
	storeRepo  output.StoreRepository
}

// NewReviewUseCase は ReviewUseCase の実装を生成します
func NewReviewUseCase(reviewRepo output.ReviewRepository, storeRepo output.StoreRepository) ReviewUseCase {
	return &reviewUseCase{
		reviewRepo: reviewRepo,
		storeRepo:  storeRepo,
	}
}

func (uc *reviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error) {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	return uc.reviewRepo.FindByStoreID(ctx, storeID)
}

func (uc *reviewUseCase) CreateReview(ctx context.Context, storeID int64, userID string, in input.CreateReviewInput) (*domain.Review, error) {
	if in.MenuID <= 0 {
		return nil, ErrInvalidInput
	}
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// バリデーション
	if in.UserID == "" {
		return nil, ErrInvalidInput
	}
	if in.Rating < 1 || in.Rating > 5 {
		return nil, ErrInvalidRating
	}

	review := &domain.Review{
		StoreID:   storeID,
		UserID:    in.UserID,
		MenuID:    in.MenuID,
		Rating:    in.Rating,
		Content:   in.Content,
		ImageURLs: append([]string(nil), in.ImageURLs...),
		PostedAt:  time.Now(),
	}

	if err := uc.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}
