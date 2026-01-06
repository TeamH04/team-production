package input

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// StoreUseCase defines inbound port for store operations.
type StoreUseCase interface {
	GetAllStores(ctx context.Context) ([]entity.Store, error)
	GetStoreByID(ctx context.Context, id string) (*entity.Store, error)
	CreateStore(ctx context.Context, input CreateStoreInput) (*entity.Store, error)
	UpdateStore(ctx context.Context, id string, input UpdateStoreInput) (*entity.Store, error)
	DeleteStore(ctx context.Context, id string) error
}

type CreateStoreInput struct {
	Name            string
	Address         string
	ThumbnailFileID *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	Latitude        float64
	Longitude       float64
	GoogleMapURL    *string
}

type UpdateStoreInput struct {
	Name            *string
	Address         *string
	ThumbnailFileID *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	Latitude        *float64
	Longitude       *float64
	GoogleMapURL    *string
}
