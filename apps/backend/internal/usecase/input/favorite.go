package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// FavoriteUseCase defines inbound port for favorite operations.
type FavoriteUseCase interface {
	GetMyFavorites(ctx context.Context, userID string) ([]entity.Favorite, error)
	AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error)
	RemoveFavorite(ctx context.Context, userID string, storeID string) error
}
