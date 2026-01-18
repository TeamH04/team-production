package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// ReviewUseCase defines inbound port for review operations.
type ReviewUseCase interface {
	GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error)
	Create(ctx context.Context, storeID string, userID string, input CreateReview) error
	LikeReview(ctx context.Context, reviewID string, userID string) error
	UnlikeReview(ctx context.Context, reviewID string, userID string) error
}

type RatingDetails struct {
	Taste       *int `json:"taste,omitempty"`
	Atmosphere  *int `json:"atmosphere,omitempty"`
	Service     *int `json:"service,omitempty"`
	Speed       *int `json:"speed,omitempty"`
	Cleanliness *int `json:"cleanliness,omitempty"`
}

type CreateReview struct {
	MenuIDs       []string       `json:"menu_ids"`
	Rating        int            `json:"rating"`
	RatingDetails *RatingDetails `json:"rating_details,omitempty"`
	Content       *string        `json:"content"`
	FileIDs       []string       `json:"file_ids"`
}
