package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

type CreateReview struct {
	StoreID string
	UserID  string
	MenuIDs []string
	Rating  int
	Content *string
	FileIDs []string
}

// ReviewRepository abstracts review persistence boundary.
type ReviewRepository interface {
	FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error)
	FindByID(ctx context.Context, reviewID string) (*entity.Review, error)
	FindByUserID(ctx context.Context, userID string) ([]entity.Review, error)
	CreateInTx(ctx context.Context, tx interface{}, review CreateReview) error
	AddLike(ctx context.Context, reviewID string, userID string) error
	RemoveLike(ctx context.Context, reviewID string, userID string) error
}
