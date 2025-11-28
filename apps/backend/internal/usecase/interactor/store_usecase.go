package interactor

import (
	"context"
	"errors"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input_port"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output_port"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// StoreUseCase はストアに関するビジネスロジックを提供します
type StoreUseCase interface {
	GetAllStores(ctx context.Context) ([]domain.Store, error)
	GetStoreByID(ctx context.Context, id int64) (*domain.Store, error)
	CreateStore(ctx context.Context, input input_port.CreateStoreInput) (*domain.Store, error)
	UpdateStore(ctx context.Context, id int64, input input_port.UpdateStoreInput) (*domain.Store, error)
	DeleteStore(ctx context.Context, id int64) error
}

type storeUseCase struct {
	storeRepo output_port.StoreRepository
}

// NewStoreUseCase は StoreUseCase の実装を生成します
func NewStoreUseCase(storeRepo output_port.StoreRepository) StoreUseCase {
	return &storeUseCase{
		storeRepo: storeRepo,
	}
}

func (uc *storeUseCase) GetAllStores(ctx context.Context) ([]domain.Store, error) {
	return uc.storeRepo.FindAll(ctx)
}

func (uc *storeUseCase) GetStoreByID(ctx context.Context, id int64) (*domain.Store, error) {
	store, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	return store, nil
}

func (uc *storeUseCase) CreateStore(ctx context.Context, input input_port.CreateStoreInput) (*domain.Store, error) {
	// バリデーション
	if input.Name == "" || input.Address == "" || input.ThumbnailURL == "" {
		return nil, ErrInvalidInput
	}
	if input.Latitude == 0.0 || input.Longitude == 0.0 {
		return nil, ErrInvalidCoordinates
	}

	store := &domain.Store{
		Name:            input.Name,
		Address:         input.Address,
		ThumbnailURL:    input.ThumbnailURL,
		OpenedAt:        input.OpenedAt,
		Description:     input.Description,
		LandscapePhotos: pq.StringArray(input.LandscapePhotos),
		OpeningHours:    input.OpeningHours,
		Latitude:        input.Latitude,
		Longitude:       input.Longitude,
		IsApproved:      false,
	}

	if err := uc.storeRepo.Create(ctx, store); err != nil {
		return nil, err
	}

	return store, nil
}

func (uc *storeUseCase) UpdateStore(ctx context.Context, id int64, input input_port.UpdateStoreInput) (*domain.Store, error) {
	// 既存のストアを取得
	store, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// 更新フィールドの適用
	if input.Name != nil {
		store.Name = *input.Name
	}
	if input.Address != nil {
		store.Address = *input.Address
	}
	if input.ThumbnailURL != nil {
		store.ThumbnailURL = *input.ThumbnailURL
	}
	if input.OpenedAt != nil {
		store.OpenedAt = input.OpenedAt
	}
	if input.Description != nil {
		store.Description = input.Description
	}
	if input.OpeningHours != nil {
		store.OpeningHours = input.OpeningHours
	}
	if len(input.LandscapePhotos) > 0 {
		store.LandscapePhotos = pq.StringArray(input.LandscapePhotos)
	}
	if input.Latitude != nil {
		store.Latitude = *input.Latitude
	}
	if input.Longitude != nil {
		store.Longitude = *input.Longitude
	}
	store.UpdatedAt = time.Now()

	if err := uc.storeRepo.Update(ctx, store); err != nil {
		return nil, err
	}

	// 更新後のストアを取得
	return uc.storeRepo.FindByID(ctx, id)
}

func (uc *storeUseCase) DeleteStore(ctx context.Context, id int64) error {
	// 存在確認
	_, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	return uc.storeRepo.Delete(ctx, id)
}
