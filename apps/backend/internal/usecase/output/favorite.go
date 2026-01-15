package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// FavoriteRepository abstracts favorite persistence boundary.
type FavoriteRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]entity.Favorite, error)
	FindByUserAndStore(ctx context.Context, userID string, storeID string) (*entity.Favorite, error)
	Create(ctx context.Context, favorite *entity.Favorite) error
	Delete(ctx context.Context, userID string, storeID string) error
}
