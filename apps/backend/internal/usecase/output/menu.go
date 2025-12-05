package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// MenuRepository abstracts menu persistence boundary.
type MenuRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	Create(ctx context.Context, menu *domain.Menu) error
}
