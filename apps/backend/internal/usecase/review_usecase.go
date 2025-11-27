package usecase

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
)

// ReviewUseCase はレビューに関するビジネスロジックを提供します
type ReviewUseCase interface {
	GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	CreateReview(ctx context.Context, storeID int64, input CreateReviewInput) (*domain.Review, error)
}

type CreateReviewInput struct {
	UserID    string
	MenuID    int64
	Rating    int
	Content   *string
	ImageURLs []string
}

type reviewUseCase struct {
	reviewRepo ports.ReviewRepository
	storeRepo  ports.StoreRepository
}

// NewReviewUseCase は ReviewUseCase の実装を生成します
func NewReviewUseCase(reviewRepo ports.ReviewRepository, storeRepo ports.StoreRepository) ReviewUseCase {
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

func (uc *reviewUseCase) CreateReview(ctx context.Context, storeID int64, input CreateReviewInput) (*domain.Review, error) {
	if input.MenuID <= 0 {
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
	if input.UserID == "" {
		return nil, ErrInvalidInput
	}
	if input.Rating < 1 || input.Rating > 5 {
		return nil, ErrInvalidRating
	}

	review := &domain.Review{
		StoreID:   storeID,
		UserID:    input.UserID,
		MenuID:    input.MenuID,
		Rating:    input.Rating,
		Content:   input.Content,
		ImageURLs: append([]string(nil), input.ImageURLs...),
		PostedAt:  time.Now(),
	}

	if err := uc.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}
