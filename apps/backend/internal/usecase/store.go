package usecase

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// StoreUseCase はストアに関するビジネスロジックを提供します
type StoreUseCase interface {
	GetAllStores(ctx context.Context) ([]domain.Store, error)
	GetStoreByID(ctx context.Context, id int64) (*domain.Store, error)
	CreateStore(ctx context.Context, input input.CreateStoreInput) (*domain.Store, error)
	UpdateStore(ctx context.Context, id int64, input input.UpdateStoreInput) (*domain.Store, error)
	DeleteStore(ctx context.Context, id int64) error
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

func (uc *storeUseCase) GetAllStores(ctx context.Context) ([]domain.Store, error) {
	return uc.storeRepo.FindAll(ctx)
}

func (uc *storeUseCase) GetStoreByID(ctx context.Context, id int64) (*domain.Store, error) {
	store, err := uc.storeRepo.FindByID(ctx, id)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}
	return store, nil
}

func (uc *storeUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*domain.Store, error) {
	// バリデーション
	if in.Name == "" || in.Address == "" || in.ThumbnailURL == "" {
		return nil, ErrInvalidInput
	}
	if in.Latitude == 0.0 || in.Longitude == 0.0 {
		return nil, ErrInvalidCoordinates
	}

	store := &domain.Store{
		Name:            in.Name,
		Address:         in.Address,
		ThumbnailURL:    in.ThumbnailURL,
		OpenedAt:        in.OpenedAt,
		Description:     in.Description,
		LandscapePhotos: append([]string(nil), in.LandscapePhotos...),
		OpeningHours:    in.OpeningHours,
		Latitude:        in.Latitude,
		Longitude:       in.Longitude,
		IsApproved:      false,
	}

	if err := uc.storeRepo.Create(ctx, store); err != nil {
		return nil, err
	}

	return store, nil
}

func (uc *storeUseCase) UpdateStore(ctx context.Context, id int64, in input.UpdateStoreInput) (*domain.Store, error) {
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
	if in.ThumbnailURL != nil {
		store.ThumbnailURL = *in.ThumbnailURL
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
	if len(in.LandscapePhotos) > 0 {
		store.LandscapePhotos = append([]string(nil), in.LandscapePhotos...)
	}
	if in.Latitude != nil {
		store.Latitude = *in.Latitude
	}
	if in.Longitude != nil {
		store.Longitude = *in.Longitude
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
	if _, err := uc.storeRepo.FindByID(ctx, id); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	return uc.storeRepo.Delete(ctx, id)
}
