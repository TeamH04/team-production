package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// FavoriteRepository はお気に入りのデータアクセスを抽象化するインターフェース
type FavoriteRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]domain.Favorite, error)
	FindByUserAndStore(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error)
	Create(ctx context.Context, favorite *domain.Favorite) error
	Delete(ctx context.Context, userID string, storeID int64) error
}

type favoriteRepository struct {
	db *gorm.DB
}

// NewFavoriteRepository は FavoriteRepository の実装を生成します
func NewFavoriteRepository(db *gorm.DB) FavoriteRepository {
	return &favoriteRepository{db: db}
}

func (r *favoriteRepository) FindByUserID(ctx context.Context, userID string) ([]domain.Favorite, error) {
	var favorites []domain.Favorite
	if err := r.db.WithContext(ctx).
		Preload("Store").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&favorites).Error; err != nil {
		return nil, err
	}
	return favorites, nil
}

func (r *favoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error) {
	var favorite domain.Favorite
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		First(&favorite).Error; err != nil {
		return nil, err
	}
	return &favorite, nil
}

func (r *favoriteRepository) Create(ctx context.Context, favorite *domain.Favorite) error {
	return r.db.WithContext(ctx).Create(favorite).Error
}

func (r *favoriteRepository) Delete(ctx context.Context, userID string, storeID int64) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		Delete(&domain.Favorite{}).Error
}
