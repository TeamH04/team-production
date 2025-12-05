package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// ReviewUseCase defines inbound port for review operations.
type ReviewUseCase interface {
	GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	CreateReview(ctx context.Context, storeID int64, userID string, input CreateReviewInput) (*domain.Review, error)
}

type CreateReviewInput struct {
	UserID    string
	MenuID    int64
	Rating    int
	Content   *string
	ImageURLs []string
}
