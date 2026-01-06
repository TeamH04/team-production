package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type reviewUseCase struct {
	reviewRepo  output.ReviewRepository
	storeRepo   output.StoreRepository
	menuRepo    output.MenuRepository
	fileRepo    output.FileRepository
	transaction output.Transaction
}

// NewReviewUseCase は ReviewUseCase の実装を生成します
func NewReviewUseCase(
	reviewRepo output.ReviewRepository,
	storeRepo output.StoreRepository,
	menuRepo output.MenuRepository,
	fileRepo output.FileRepository,
) input.ReviewUseCase {
	return &reviewUseCase{
		reviewRepo: reviewRepo,
		storeRepo:  storeRepo,
		menuRepo:   menuRepo,
		fileRepo:   fileRepo,
	}
}

func (uc *reviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	return uc.reviewRepo.FindByStoreID(ctx, storeID, normalizeReviewSort(sort), viewerID)
}

func (uc *reviewUseCase) Create(ctx context.Context, storeID string, userID string, input input.CreateReview) error {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	if input.Rating < 1 || input.Rating > 5 {
		return ErrInvalidRating
	}

	return uc.transaction.StartTransaction(func(tx interface{}) error {
		return uc.reviewRepo.CreateInTx(ctx, tx, output.CreateReview{
			StoreID: storeID,
			UserID:  userID,
			Rating:  input.Rating,
			Content: input.Content,
			MenuIDs: input.MenuIDs,
			FileIDs: input.FileIDs,
		})
	})
}

func (uc *reviewUseCase) LikeReview(ctx context.Context, reviewID string, userID string) error {
	if reviewID == "" || userID == "" {
		return ErrInvalidInput
	}
	if _, err := uc.reviewRepo.FindByID(ctx, reviewID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrReviewNotFound
		}
		return err
	}
	return uc.reviewRepo.AddLike(ctx, reviewID, userID)
}

func (uc *reviewUseCase) UnlikeReview(ctx context.Context, reviewID string, userID string) error {
	if reviewID == "" || userID == "" {
		return ErrInvalidInput
	}
	if _, err := uc.reviewRepo.FindByID(ctx, reviewID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrReviewNotFound
		}
		return err
	}
	return uc.reviewRepo.RemoveLike(ctx, reviewID, userID)
}

func normalizeReviewSort(sort string) string {
	switch sort {
	case "liked":
		return "liked"
	default:
		return "new"
	}
}
