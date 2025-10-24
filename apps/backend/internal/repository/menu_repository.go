package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// MenuRepository はメニューのデータアクセスを抽象化するインターフェース
type MenuRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	Create(ctx context.Context, menu *domain.Menu) error
}

type menuRepository struct {
	db *gorm.DB
}

// NewMenuRepository は MenuRepository の実装を生成します
func NewMenuRepository(db *gorm.DB) MenuRepository {
	return &menuRepository{db: db}
}

func (r *menuRepository) FindByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error) {
	var menus []domain.Menu
	if err := r.db.WithContext(ctx).
		Where("store_id = ?", storeID).
		Order("created_at desc").
		Find(&menus).Error; err != nil {
		return nil, err
	}
	return menus, nil
}

func (r *menuRepository) Create(ctx context.Context, menu *domain.Menu) error {
	return r.db.WithContext(ctx).Create(menu).Error
}
