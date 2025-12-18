package input

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// StoreUseCase defines inbound port for store operations.
type StoreUseCase interface {
	GetAllStores(ctx context.Context) ([]domain.Store, error)
	GetStoreByID(ctx context.Context, id int64) (*domain.Store, error)
	CreateStore(ctx context.Context, input CreateStoreInput) (*domain.Store, error)
	UpdateStore(ctx context.Context, id int64, input UpdateStoreInput) (*domain.Store, error)
	DeleteStore(ctx context.Context, id int64) error
}

type CreateStoreInput struct {
	Name            string
	Address         string
	ThumbnailURL    string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        float64
	Longitude       float64
	PlaceID         string
}

type UpdateStoreInput struct {
	Name            *string
	Address         *string
	ThumbnailURL    *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	LandscapePhotos []string
	Latitude        *float64
	Longitude       *float64
	PlaceID         *string
}
