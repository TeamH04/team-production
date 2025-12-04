package handlers

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type StoreHandler struct {
	storeUseCase input.StoreUseCase
}

var _ StoreController = (*StoreHandler)(nil)

type CreateStoreCommand struct {
	Name            string
	Address         string
	ThumbnailURL    string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        float64
	Longitude       float64
}

func (c CreateStoreCommand) toInput() input.CreateStoreInput {
	return input.CreateStoreInput{
		Name:            c.Name,
		Address:         c.Address,
		ThumbnailURL:    c.ThumbnailURL,
		OpenedAt:        c.OpenedAt,
		Description:     c.Description,
		OpeningHours:    c.OpeningHours,
		LandscapePhotos: append([]string(nil), c.LandscapePhotos...),
		Latitude:        c.Latitude,
		Longitude:       c.Longitude,
	}
}

type UpdateStoreCommand struct {
	Name            *string
	Address         *string
	ThumbnailURL    *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        *float64
	Longitude       *float64
}

func (c UpdateStoreCommand) toInput() input.UpdateStoreInput {
	return input.UpdateStoreInput{
		Name:            c.Name,
		Address:         c.Address,
		ThumbnailURL:    c.ThumbnailURL,
		OpenedAt:        c.OpenedAt,
		Description:     c.Description,
		OpeningHours:    c.OpeningHours,
		LandscapePhotos: append([]string(nil), c.LandscapePhotos...),
		Latitude:        c.Latitude,
		Longitude:       c.Longitude,
	}
}

func NewStoreHandler(storeUseCase input.StoreUseCase) *StoreHandler {
	return &StoreHandler{
		storeUseCase: storeUseCase,
	}
}

func (h *StoreHandler) GetStores(ctx context.Context) ([]domain.Store, error) {
	return h.storeUseCase.GetAllStores(ctx)
}

func (h *StoreHandler) GetStoreByID(ctx context.Context, id int64) (*domain.Store, error) {
	return h.storeUseCase.GetStoreByID(ctx, id)
}

func (h *StoreHandler) CreateStore(ctx context.Context, cmd CreateStoreCommand) (*domain.Store, error) {
	return h.storeUseCase.CreateStore(ctx, cmd.toInput())
}

func (h *StoreHandler) UpdateStore(ctx context.Context, id int64, cmd UpdateStoreCommand) (*domain.Store, error) {
	return h.storeUseCase.UpdateStore(ctx, id, cmd.toInput())
}

func (h *StoreHandler) DeleteStore(ctx context.Context, id int64) error {
	return h.storeUseCase.DeleteStore(ctx, id)
}
