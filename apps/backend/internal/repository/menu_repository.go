package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"gorm.io/gorm"
)

type menuRepository struct {
	db *gorm.DB
}

// NewMenuRepository は MenuRepository の実装を生成します
func NewMenuRepository(db *gorm.DB) ports.MenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) FindByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error) {
	var menus []model.Menu
	if err := r.db.WithContext(ctx).
		Where("store_id = ?", storeID).
		Order("created_at desc").
		Find(&menus).Error; err != nil {
		return nil, mapDBError(err)
	}
	result := make([]domain.Menu, len(menus))
	for i, menu := range menus {
		result[i] = model.MenuModelToDomain(menu)
	}
	return result, nil
}

func (r *menuRepository) Create(ctx context.Context, menu *domain.Menu) error {
	record := model.MenuModelFromDomain(menu)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	menu.MenuID = record.MenuID
	menu.CreatedAt = record.CreatedAt
	return nil
}
