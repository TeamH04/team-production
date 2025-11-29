package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// StoreRepository はストアのデータアクセスを抽象化するインターフェース
type StoreRepository interface {
	FindAll(ctx context.Context) ([]domain.Store, error)
	FindByID(ctx context.Context, id int64) (*domain.Store, error)
	Create(ctx context.Context, store *domain.Store) error
	Update(ctx context.Context, store *domain.Store) error
	Delete(ctx context.Context, id int64) error
}

type storeRepository struct {
	db *gorm.DB
}

// NewStoreRepository は StoreRepository の実装を生成します
func NewStoreRepository(db *gorm.DB) StoreRepository {
	return &storeRepository{db: db}
}

func (r *storeRepository) FindAll(ctx context.Context) ([]domain.Store, error) {
	var stores []domain.Store
	if err := r.db.WithContext(ctx).Order("created_at desc").Find(&stores).Error; err != nil {
		return nil, err
	}
	return stores, nil
}

func (r *storeRepository) FindByID(ctx context.Context, id int64) (*domain.Store, error) {
	var store domain.Store
	if err := r.db.WithContext(ctx).
		Preload("Menus").
		Preload("Reviews").
		First(&store, "store_id = ?", id).Error; err != nil {
		return nil, err
	}
	return &store, nil
}

func (r *storeRepository) Create(ctx context.Context, store *domain.Store) error {
	return r.db.WithContext(ctx).Create(store).Error
}

func (r *storeRepository) Update(ctx context.Context, store *domain.Store) error {
	return r.db.WithContext(ctx).Model(store).Updates(store).Error
}

func (r *storeRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&domain.Store{}, id).Error
}
