package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// FavoriteRepository abstracts favorite persistence boundary.
type FavoriteRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]domain.Favorite, error)
	FindByUserAndStore(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error)
	Create(ctx context.Context, favorite *domain.Favorite) error
	Delete(ctx context.Context, userID string, storeID int64) error
}
