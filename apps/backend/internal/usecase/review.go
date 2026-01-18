package usecase

import (
	"context"

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
	transaction output.Transaction,
) input.ReviewUseCase {
	return &reviewUseCase{
		reviewRepo:  reviewRepo,
		storeRepo:   storeRepo,
		menuRepo:    menuRepo,
		fileRepo:    fileRepo,
		transaction: transaction,
	}
}

func (uc *reviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	// ストアの存在確認
	if err := ensureStoreExists(ctx, uc.storeRepo, storeID); err != nil {
		return nil, err
	}

	return uc.reviewRepo.FindByStoreID(ctx, storeID, normalizeReviewSort(sort), viewerID)
}

func (uc *reviewUseCase) Create(ctx context.Context, storeID string, userID string, input input.CreateReview) error {
	if storeID == "" || userID == "" {
		return ErrInvalidInput
	}

	// ストアの存在確認
	if err := ensureStoreExists(ctx, uc.storeRepo, storeID); err != nil {
		return err
	}

	if input.Rating < 1 || input.Rating > 5 {
		return ErrInvalidRating
	}

	menuIDs := dedupeStrings(input.MenuIDs)
	if len(menuIDs) > 0 {
		menus, err := uc.menuRepo.FindByStoreAndIDs(ctx, storeID, menuIDs)
		if err != nil {
			return err
		}
		if len(menus) != len(menuIDs) {
			return ErrInvalidInput
		}
	}

	fileIDs := dedupeStrings(input.FileIDs)
	if len(fileIDs) > 0 {
		files, err := uc.fileRepo.FindByStoreAndIDs(ctx, storeID, fileIDs)
		if err != nil {
			return err
		}
		if len(files) != len(fileIDs) {
			return ErrInvalidFileIDs
		}
	}

	if uc.transaction == nil {
		return output.ErrInvalidTransaction
	}

	var ratingDetails *output.RatingDetails
	if input.RatingDetails != nil {
		ratingDetails = &output.RatingDetails{
			Taste:       input.RatingDetails.Taste,
			Atmosphere:  input.RatingDetails.Atmosphere,
			Service:     input.RatingDetails.Service,
			Speed:       input.RatingDetails.Speed,
			Cleanliness: input.RatingDetails.Cleanliness,
		}
	}

	return uc.transaction.StartTransaction(func(tx interface{}) error {
		return uc.reviewRepo.CreateInTx(ctx, tx, output.CreateReview{
			StoreID:       storeID,
			UserID:        userID,
			Rating:        input.Rating,
			RatingDetails: ratingDetails,
			Content:       input.Content,
			MenuIDs:       menuIDs,
			FileIDs:       fileIDs,
		})
	})
}

func (uc *reviewUseCase) LikeReview(ctx context.Context, reviewID string, userID string) error {
	if reviewID == "" || userID == "" {
		return ErrInvalidInput
	}
	if err := ensureReviewExists(ctx, uc.reviewRepo, reviewID); err != nil {
		return err
	}
	return uc.reviewRepo.AddLike(ctx, reviewID, userID)
}

func (uc *reviewUseCase) UnlikeReview(ctx context.Context, reviewID string, userID string) error {
	if reviewID == "" || userID == "" {
		return ErrInvalidInput
	}
	if err := ensureReviewExists(ctx, uc.reviewRepo, reviewID); err != nil {
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

func dedupeStrings(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	return result
}
