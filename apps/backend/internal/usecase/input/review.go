package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// ReviewUseCase defines inbound port for review operations.
type ReviewUseCase interface {
	GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error)
	CreateReview(ctx context.Context, storeID string, userID string, input CreateReview) (*entity.Review, error)
	LikeReview(ctx context.Context, reviewID string, userID string) error
	UnlikeReview(ctx context.Context, reviewID string, userID string) error
}

type CreateReview struct {
	MenuIDs []string
	Rating  int
	Content *string
	FileIDs []string
}
