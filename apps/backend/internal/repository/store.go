package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type storeRepository struct {
	db *gorm.DB
}

// NewStoreRepository は StoreRepository の実装を生成します
func NewStoreRepository(db *gorm.DB) output.StoreRepository {
	return &storeRepository{db: db}
}

func (r *storeRepository) FindAll(ctx context.Context) ([]domain.Store, error) {
	var stores []model.Store
	if err := r.db.WithContext(ctx).
		Preload("Menus").
		Preload("Reviews").
		Order("created_at desc").
		Find(&stores).Error; err != nil {
		return nil, mapDBError(err)
	}

	result := make([]domain.Store, len(stores))
	for i, s := range stores {
		result[i] = model.StoreModelToDomain(s)
	}
	return result, nil
}

func (r *storeRepository) FindPending(ctx context.Context) ([]domain.Store, error) {
	var stores []model.Store
	if err := r.db.WithContext(ctx).
		Where("is_approved = ?", false).
		Order("created_at asc").
		Find(&stores).Error; err != nil {
		return nil, mapDBError(err)
	}

	result := make([]domain.Store, len(stores))
	for i, s := range stores {
		result[i] = model.StoreModelToDomain(s)
	}
	return result, nil
}

func (r *storeRepository) FindByID(ctx context.Context, id int64) (*domain.Store, error) {
	var store model.Store
	if err := r.db.WithContext(ctx).
		Preload("Menus").
		Preload("Reviews").
		First(&store, "store_id = ?", id).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainStore := model.StoreModelToDomain(store)
	return &domainStore, nil
}

func (r *storeRepository) Create(ctx context.Context, store *domain.Store) error {
	record := model.StoreModelFromDomain(store)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	store.StoreID = record.StoreID
	store.CreatedAt = record.CreatedAt
	store.UpdatedAt = record.UpdatedAt
	return nil
}

func (r *storeRepository) Update(ctx context.Context, store *domain.Store) error {
	record := model.StoreModelFromDomain(store)
	return mapDBError(r.db.WithContext(ctx).Model(&model.Store{StoreID: store.StoreID}).Updates(record).Error)
}

func (r *storeRepository) Delete(ctx context.Context, id int64) error {
	return mapDBError(r.db.WithContext(ctx).Delete(&model.Store{}, id).Error)
}
