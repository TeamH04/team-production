package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type favoriteRepository struct {
	db *gorm.DB
}

// NewFavoriteRepository は FavoriteRepository の実装を生成します
func NewFavoriteRepository(db *gorm.DB) output.FavoriteRepository {
	return &favoriteRepository{db: db}
}

func (r *favoriteRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Favorite, error) {
	var favorites []model.Favorite
	if err := r.db.WithContext(ctx).
		Preload("Store").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&favorites).Error; err != nil {
		return nil, mapDBError(err)
	}
	result := model.ToEntities[entity.Favorite, model.Favorite](favorites)
	return result, nil
}

func (r *favoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	var favorite model.Favorite
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		First(&favorite).Error; err != nil {
		return nil, mapDBError(err)
	}
	entityFavorite := favorite.Entity()
	return &entityFavorite, nil
}

func (r *favoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	record := model.Favorite{
		UserID:  favorite.UserID,
		StoreID: favorite.StoreID,
	}
	if err := r.db.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}
	favorite.CreatedAt = record.CreatedAt
	return nil
}

func (r *favoriteRepository) Delete(ctx context.Context, userID string, storeID string) error {
	return mapDBError(r.db.WithContext(ctx).
		Where("user_id = ? AND store_id = ?", userID, storeID).
		Delete(&model.Favorite{}).Error)
}
