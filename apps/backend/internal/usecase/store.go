package usecase

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// StoreUseCase はストアに関するビジネスロジックを提供します
type StoreUseCase interface {
	GetAllStores(ctx context.Context) ([]entity.Store, error)
	GetStoreByID(ctx context.Context, id string) (*entity.Store, error)
	CreateStore(ctx context.Context, input input.CreateStoreInput) (*entity.Store, error)
	UpdateStore(ctx context.Context, id string, input input.UpdateStoreInput) (*entity.Store, error)
	DeleteStore(ctx context.Context, id string) error
}

type storeUseCase struct {
	storeRepo output.StoreRepository
}

// NewStoreUseCase は StoreUseCase の実装を生成します
func NewStoreUseCase(storeRepo output.StoreRepository) StoreUseCase {
	return &storeUseCase{
		storeRepo: storeRepo,
	}
}

func (uc *storeUseCase) GetAllStores(ctx context.Context) ([]entity.Store, error) {
	return uc.storeRepo.FindAll(ctx)
}

func (uc *storeUseCase) GetStoreByID(ctx context.Context, id string) (*entity.Store, error) {
	store, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	return store, nil
}

func (uc *storeUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*entity.Store, error) {
	// バリデーション
	if in.Name == "" || in.Address == "" {
		return nil, ErrInvalidInput
	}
	if in.PlaceID == "" {
		return nil, ErrInvalidInput
	}
	if in.Latitude == 0.0 || in.Longitude == 0.0 {
		return nil, ErrInvalidCoordinates
	}
	if in.ThumbnailFileID == nil {
		return nil, ErrInvalidInput
	}

	store := &entity.Store{
		Name:            in.Name,
		Address:         in.Address,
		ThumbnailFileID: in.ThumbnailFileID,
		OpenedAt:        in.OpenedAt,
		Description:     in.Description,
		OpeningHours:    in.OpeningHours,
		Latitude:        in.Latitude,
		Longitude:       in.Longitude,
		GoogleMapURL:    in.GoogleMapURL,
		PlaceID:         in.PlaceID,
		IsApproved:      false,
	}

	if err := uc.storeRepo.Create(ctx, store); err != nil {
		return nil, err
	}

	return store, nil
}

func (uc *storeUseCase) UpdateStore(ctx context.Context, id string, in input.UpdateStoreInput) (*entity.Store, error) {
	// 既存のストアを取得
	store, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// 更新フィールドの適用
	if in.Name != nil {
		store.Name = *in.Name
	}
	if in.Address != nil {
		store.Address = *in.Address
	}
	if in.ThumbnailFileID != nil {
		store.ThumbnailFileID = in.ThumbnailFileID
	}
	if in.OpenedAt != nil {
		store.OpenedAt = in.OpenedAt
	}
	if in.Description != nil {
		store.Description = in.Description
	}
	if in.OpeningHours != nil {
		store.OpeningHours = in.OpeningHours
	}
	if in.Latitude != nil {
		store.Latitude = *in.Latitude
	}
	if in.Longitude != nil {
		store.Longitude = *in.Longitude
	}
	if in.GoogleMapURL != nil {
		store.GoogleMapURL = in.GoogleMapURL
	}
	if in.PlaceID != nil {
		if *in.PlaceID == "" {
			return nil, ErrInvalidInput
		}
		store.PlaceID = *in.PlaceID
	}
	store.UpdatedAt = time.Now()

	if err := uc.storeRepo.Update(ctx, store); err != nil {
		return nil, err
	}

	// 更新後のストアを取得
	return uc.storeRepo.FindByID(ctx, id)
}

func (uc *storeUseCase) DeleteStore(ctx context.Context, id string) error {
	// 存在確認
	if _, err := uc.storeRepo.FindByID(ctx, id); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	return uc.storeRepo.Delete(ctx, id)
}
