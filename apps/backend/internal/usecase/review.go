package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type reviewUseCase struct {
	reviewRepo output.ReviewRepository
	storeRepo  output.StoreRepository
	menuRepo   output.MenuRepository
	fileRepo   output.FileRepository
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

func (uc *reviewUseCase) CreateReview(ctx context.Context, storeID string, userID string, input input.CreateReview) (*entity.Review, error) {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	if input.Rating < 1 || input.Rating > 5 {
		return nil, ErrInvalidRating
	}

	for _, fileID := range input.FileIDs {
		if fileID == "" {
			return nil, ErrInvalidInput
		}
	}

	menus, err := uc.menuRepo.FindByStoreAndIDs(ctx, storeID, input.MenuIDs)
	if err != nil {
		return nil, err
	}

	allFileIDs := uniqueStrings(input.FileIDs)
	fileMap := make(map[string]entity.File, len(allFileIDs))
	if len(allFileIDs) > 0 {
		files, err := uc.fileRepo.FindByStoreAndIDs(ctx, storeID, allFileIDs)
		if err != nil {
			return nil, err
		}
		if len(files) != len(allFileIDs) {
			return nil, ErrInvalidInput
		}
		for _, file := range files {
			fileMap[file.FileID] = file
		}
	}

	review := &entity.Review{
		StoreID: storeID,
		UserID:  userID,
		Rating:  input.Rating,
		Content: input.Content,
		Menus:   menus,
		Files:   buildFileList(input.FileIDs, fileMap),
	}

	if err := uc.reviewRepo.Create(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
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

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, v := range values {
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		result = append(result, v)
	}
	return result
}

func buildFileList(ids []string, fileMap map[string]entity.File) []entity.File {
	if len(ids) == 0 || len(fileMap) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(ids))
	files := make([]entity.File, 0, len(ids))
	for _, id := range ids {
		if _, ok := seen[id]; ok {
			continue
		}
		if file, ok := fileMap[id]; ok {
			files = append(files, file)
			seen[id] = struct{}{}
		}
	}
	return files
}
