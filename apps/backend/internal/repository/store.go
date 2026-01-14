package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
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

// withFullPreload adds all standard preloads for store queries.
func (r *storeRepository) withFullPreload(db *gorm.DB) *gorm.DB {
	return db.
		Preload("ThumbnailFile").
		Preload("Menus").
		Preload("Reviews.Menus").
		Preload("Reviews.Files").
		Preload("Tags").
		Preload("Files")
}

func (r *storeRepository) FindAll(ctx context.Context) ([]entity.Store, error) {
	var stores []model.Store
	if err := r.withFullPreload(r.db.WithContext(ctx)).
		Order("created_at desc").
		Find(&stores).Error; err != nil {
		return nil, mapDBError(err)
	}

	return model.ToEntities[entity.Store, model.Store](stores), nil
}

func (r *storeRepository) FindPending(ctx context.Context) ([]entity.Store, error) {
	var stores []model.Store
	if err := r.db.WithContext(ctx).
		Preload("ThumbnailFile").
		Where("is_approved = ?", false).
		Order("created_at asc").
		Find(&stores).Error; err != nil {
		return nil, mapDBError(err)
	}

	return model.ToEntities[entity.Store, model.Store](stores), nil
}

func (r *storeRepository) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	var store model.Store
	if err := r.withFullPreload(r.db.WithContext(ctx)).
		First(&store, "store_id = ?", id).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainStore := store.Entity()
	return &domainStore, nil
}

func (r *storeRepository) Create(ctx context.Context, store *entity.Store) error {
	record := model.Store{
		StoreID:         store.StoreID,
		ThumbnailFileID: store.ThumbnailFileID,
		Name:            store.Name,
		OpenedAt:        store.OpenedAt,
		Description:     store.Description,
		Address:         store.Address,
		OpeningHours:    store.OpeningHours,
		Latitude:        store.Latitude,
		Longitude:       store.Longitude,
		GoogleMapURL:    store.GoogleMapURL,
		PlaceID:         store.PlaceID,
		IsApproved:      store.IsApproved,
		Category:        store.Category,
		Budget:          store.Budget,
		AverageRating:   store.AverageRating,
		DistanceMinutes: store.DistanceMinutes,
	}
	if err := r.db.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}
	store.StoreID = record.StoreID
	store.CreatedAt = record.CreatedAt
	store.UpdatedAt = record.UpdatedAt
	return nil
}

func (r *storeRepository) Update(ctx context.Context, store *entity.Store) error {
	updates := map[string]any{
		"thumbnail_file_id": store.ThumbnailFileID,
		"name":              store.Name,
		"opened_at":         store.OpenedAt,
		"description":       store.Description,
		"address":           store.Address,
		"opening_hours":     store.OpeningHours,
		"latitude":          store.Latitude,
		"longitude":         store.Longitude,
		"google_map_url":    store.GoogleMapURL,
		"place_id":          store.PlaceID,
		"is_approved":       store.IsApproved,
		"category":          store.Category,
		"budget":            store.Budget,
		"average_rating":    store.AverageRating,
		"distance_minutes":  store.DistanceMinutes,
		"updated_at":        store.UpdatedAt,
	}
	return mapDBError(r.db.WithContext(ctx).Model(&model.Store{StoreID: store.StoreID}).Updates(updates).Error)
}

func (r *storeRepository) Delete(ctx context.Context, id string) error {
	return mapDBError(r.db.WithContext(ctx).Where("store_id = ?", id).Delete(&model.Store{}).Error)
}
