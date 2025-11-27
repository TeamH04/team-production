package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"gorm.io/gorm"
)

type favoriteRepository struct {
	db *gorm.DB
}

// NewFavoriteRepository は FavoriteRepository の実装を生成します
func NewFavoriteRepository(db *gorm.DB) ports.FavoriteRepository {
	return &favoriteRepository{db: db}
}

func (r *favoriteRepository) FindByUserID(ctx context.Context, userID string) ([]domain.Favorite, error) {
	var favorites []model.Favorite
	if err := r.db.WithContext(ctx).
		Preload("Store").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&favorites).Error; err != nil {
		return nil, mapDBError(err)
	}
	result := make([]domain.Favorite, len(favorites))
	for i, favorite := range favorites {
		result[i] = model.FavoriteModelToDomain(favorite)
	}
	return result, nil
}

func (r *favoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error) {
	var favorite model.Favorite
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		First(&favorite).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainFavorite := model.FavoriteModelToDomain(favorite)
	return &domainFavorite, nil
}

func (r *favoriteRepository) Create(ctx context.Context, favorite *domain.Favorite) error {
	record := model.FavoriteModelFromDomain(favorite)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	favorite.FavoriteID = record.FavoriteID
	favorite.CreatedAt = record.CreatedAt
	return nil
}

func (r *favoriteRepository) Delete(ctx context.Context, userID string, storeID int64) error {
	return mapDBError(r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		Delete(&model.Favorite{}).Error)
}
