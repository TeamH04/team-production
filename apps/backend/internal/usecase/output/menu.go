package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// MenuRepository abstracts menu persistence boundary.
type MenuRepository interface {
	FindByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error)
	FindByStoreAndIDs(ctx context.Context, storeID string, menuIDs []string) ([]entity.Menu, error)
	Create(ctx context.Context, menu *entity.Menu) error
}
