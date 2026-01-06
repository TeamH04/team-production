package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// ReviewRepository abstracts review persistence boundary.
type ReviewRepository interface {
	FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error)
	FindByID(ctx context.Context, reviewID string) (*entity.Review, error)
	FindByUserID(ctx context.Context, userID string) ([]entity.Review, error)
	Create(ctx context.Context, review *entity.Review) error
	AddLike(ctx context.Context, reviewID string, userID string) error
	RemoveLike(ctx context.Context, reviewID string, userID string) error
}
