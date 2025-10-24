package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/lib/pq"
	"gorm.io/gorm"
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
	reviewRepo repository.ReviewRepository
	storeRepo  repository.StoreRepository
}

// NewReviewUseCase は ReviewUseCase の実装を生成します
func NewReviewUseCase(reviewRepo repository.ReviewRepository, storeRepo repository.StoreRepository) ReviewUseCase {
	return &reviewUseCase{
		reviewRepo: reviewRepo,
		storeRepo:  storeRepo,
	}
}

func (uc *reviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error) {
	// ストアの存在確認
	_, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	return uc.reviewRepo.FindByStoreID(ctx, storeID)
}

func (uc *reviewUseCase) CreateReview(ctx context.Context, storeID int64, input CreateReviewInput) (*domain.Review, error) {
	// ストアの存在確認
	_, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
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
		ImageURLs: pq.StringArray(input.ImageURLs),
		PostedAt:  time.Now(),
	}

	if err := uc.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}
