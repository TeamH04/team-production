package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// FavoriteUseCase defines inbound port for favorite operations.
type FavoriteUseCase interface {
	GetUserFavorites(ctx context.Context, userID string) ([]domain.Favorite, error)
	AddFavorite(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error)
	RemoveFavorite(ctx context.Context, userID string, storeID int64) error
}
