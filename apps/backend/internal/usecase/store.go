package usecase

import (
	"context"
	"math"
	"time"

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
	return mustFindStore(ctx, uc.storeRepo, id)
}

func (uc *storeUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*entity.Store, error) {
	if err := validateNotEmpty(in.Name, in.Address, in.PlaceID); err != nil {
		return nil, err
	}
	if !isValidLatitude(in.Latitude) {
		return nil, ErrInvalidCoordinates
	}
	if !isValidLongitude(in.Longitude) {
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
	store, err := mustFindStore(ctx, uc.storeRepo, id)
	if err != nil {
		return nil, err
	}

	if err := applyStoreUpdates(store, in); err != nil {
		return nil, err
	}

	if err := uc.storeRepo.Update(ctx, store); err != nil {
		return nil, err
	}

	return uc.storeRepo.FindByID(ctx, id)
}

func applyStoreUpdates(store *entity.Store, in input.UpdateStoreInput) error {
	if err := validateStoreUpdateInput(in); err != nil {
		return err
	}

	applyBasicFields(store, in)
	applyOptionalFields(store, in)
	store.UpdatedAt = time.Now()

	return nil
}

func validateStoreUpdateInput(in input.UpdateStoreInput) error {
	if in.Latitude != nil && !isValidLatitude(*in.Latitude) {
		return ErrInvalidCoordinates
	}
	if in.Longitude != nil && !isValidLongitude(*in.Longitude) {
		return ErrInvalidCoordinates
	}
	if in.PlaceID != nil && *in.PlaceID == "" {
		return ErrInvalidInput
	}
	return nil
}

func isValidLatitude(lat float64) bool {
	return lat >= -90.0 && lat <= 90.0 && !math.IsNaN(lat) && !math.IsInf(lat, 0)
}

func isValidLongitude(lng float64) bool {
	return lng >= -180.0 && lng <= 180.0 && !math.IsNaN(lng) && !math.IsInf(lng, 0)
}

func applyBasicFields(store *entity.Store, in input.UpdateStoreInput) {
	if in.Name != nil {
		store.Name = *in.Name
	}
	if in.Address != nil {
		store.Address = *in.Address
	}
	if in.PlaceID != nil {
		store.PlaceID = *in.PlaceID
	}
	if in.Latitude != nil {
		store.Latitude = *in.Latitude
	}
	if in.Longitude != nil {
		store.Longitude = *in.Longitude
	}
}

func applyOptionalFields(store *entity.Store, in input.UpdateStoreInput) {
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
	if in.GoogleMapURL != nil {
		store.GoogleMapURL = in.GoogleMapURL
	}
}

func (uc *storeUseCase) DeleteStore(ctx context.Context, id string) error {
	if err := ensureStoreExists(ctx, uc.storeRepo, id); err != nil {
		return err
	}

	return uc.storeRepo.Delete(ctx, id)
}
