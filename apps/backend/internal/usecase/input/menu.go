package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// MenuUseCase defines inbound port for menu operations.
type MenuUseCase interface {
	GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error)
	CreateMenu(ctx context.Context, storeID string, input CreateMenuInput) (*entity.Menu, error)
}

type CreateMenuInput struct {
	Name        string
	Price       *int
	Description *string
}
