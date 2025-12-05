package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// ReviewRepository abstracts review persistence boundary.
type ReviewRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	FindByUserID(ctx context.Context, userID string) ([]domain.Review, error)
	Create(ctx context.Context, review *domain.Review) error
}
