package usecase

import (
	"context"
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"gorm.io/gorm"
)

// FavoriteUseCase はお気に入りに関するビジネスロジックを提供します
type FavoriteUseCase interface {
	GetUserFavorites(ctx context.Context, userID string) ([]domain.Favorite, error)
	AddFavorite(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error)
	RemoveFavorite(ctx context.Context, userID string, storeID int64) error
}

type favoriteUseCase struct {
	favoriteRepo repository.FavoriteRepository
	userRepo     repository.UserRepository
	storeRepo    repository.StoreRepository
}

// NewFavoriteUseCase は FavoriteUseCase の実装を生成します
func NewFavoriteUseCase(
	favoriteRepo repository.FavoriteRepository,
	userRepo repository.UserRepository,
	storeRepo repository.StoreRepository,
) FavoriteUseCase {
	return &favoriteUseCase{
		favoriteRepo: favoriteRepo,
		userRepo:     userRepo,
		storeRepo:    storeRepo,
	}
}

func (uc *favoriteUseCase) GetUserFavorites(ctx context.Context, userID string) ([]domain.Favorite, error) {
	// ユーザーの存在確認
	_, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return uc.favoriteRepo.FindByUserID(ctx, userID)
}

func (uc *favoriteUseCase) AddFavorite(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error) {
	// ユーザーの存在確認
	_, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// ストアの存在確認
	_, err = uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// 既にお気に入り登録されているか確認
	existing, err := uc.favoriteRepo.FindByUserAndStore(ctx, userID, storeID)
	if err == nil && existing != nil {
		return nil, ErrAlreadyFavorite
	}

	favorite := &domain.Favorite{
		UserID:  userID,
		StoreID: storeID,
	}

	if err := uc.favoriteRepo.Create(ctx, favorite); err != nil {
		return nil, err
	}

	return favorite, nil
}

func (uc *favoriteUseCase) RemoveFavorite(ctx context.Context, userID string, storeID int64) error {
	// お気に入りの存在確認
	_, err := uc.favoriteRepo.FindByUserAndStore(ctx, userID, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFavoriteNotFound
		}
		return err
	}

	return uc.favoriteRepo.Delete(ctx, userID, storeID)
}
