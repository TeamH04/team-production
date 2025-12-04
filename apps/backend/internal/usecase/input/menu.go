package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// MenuUseCase defines inbound port for menu operations.
type MenuUseCase interface {
	GetMenusByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	CreateMenu(ctx context.Context, storeID int64, input CreateMenuInput) (*domain.Menu, error)
}

type CreateMenuInput struct {
	Name        string
	Price       *int
	ImageURL    *string
	Description *string
}
