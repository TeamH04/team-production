package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// FavoriteUseCase はお気に入りに関するビジネスロジックを提供します
type FavoriteUseCase interface {
	GetUserFavorites(ctx context.Context, userID string) ([]entity.Favorite, error)
	AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error)
	RemoveFavorite(ctx context.Context, userID string, storeID string) error
}

type favoriteUseCase struct {
	favoriteRepo output.FavoriteRepository
	userRepo     output.UserRepository
	storeRepo    output.StoreRepository
}

// NewFavoriteUseCase は FavoriteUseCase の実装を生成します
func NewFavoriteUseCase(
	favoriteRepo output.FavoriteRepository,
	userRepo output.UserRepository,
	storeRepo output.StoreRepository,
) FavoriteUseCase {
	return &favoriteUseCase{
		favoriteRepo: favoriteRepo,
		userRepo:     userRepo,
		storeRepo:    storeRepo,
	}
}

func (uc *favoriteUseCase) GetUserFavorites(ctx context.Context, userID string) ([]entity.Favorite, error) {
	// ユーザーの存在確認
	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return nil, err
	}

	return uc.favoriteRepo.FindByUserID(ctx, userID)
}

func (uc *favoriteUseCase) AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	if userID == "" || storeID == "" {
		return nil, ErrInvalidInput
	}
	// ユーザーの存在確認
	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return nil, err
	}

	// ストアの存在確認
	if err := ensureStoreExists(ctx, uc.storeRepo, storeID); err != nil {
		return nil, err
	}

	// 既にお気に入り登録されているか確認
	existing, err := uc.favoriteRepo.FindByUserAndStore(ctx, userID, storeID)
	if err == nil && existing != nil {
		return nil, ErrAlreadyFavorite
	}
	if err != nil && !apperr.IsCode(err, apperr.CodeNotFound) {
		return nil, err
	}

	favorite := &entity.Favorite{
		UserID:  userID,
		StoreID: storeID,
	}

	if err := uc.favoriteRepo.Create(ctx, favorite); err != nil {
		return nil, err
	}

	return favorite, nil
}

func (uc *favoriteUseCase) RemoveFavorite(ctx context.Context, userID string, storeID string) error {
	if userID == "" || storeID == "" {
		return ErrInvalidInput
	}

	// お気に入りの存在確認
	if _, err := uc.favoriteRepo.FindByUserAndStore(ctx, userID, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrFavoriteNotFound
		}
		return err
	}

	return uc.favoriteRepo.Delete(ctx, userID, storeID)
}
