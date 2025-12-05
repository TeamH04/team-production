package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type ReviewHandler struct {
	reviewUseCase input.ReviewUseCase
}

var _ ReviewController = (*ReviewHandler)(nil)

type CreateReviewCommand struct {
	MenuID    int64
	Rating    int
	Content   *string
	ImageURLs []string
}

func (c CreateReviewCommand) toInput(userID string) input.CreateReviewInput {
	return input.CreateReviewInput{
		UserID:    userID,
		MenuID:    c.MenuID,
		Rating:    c.Rating,
		Content:   c.Content,
		ImageURLs: append([]string(nil), c.ImageURLs...),
	}
}

func NewReviewHandler(reviewUseCase input.ReviewUseCase) *ReviewHandler {
	return &ReviewHandler{
		reviewUseCase: reviewUseCase,
	}
}

func (h *ReviewHandler) GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error) {
	return h.reviewUseCase.GetReviewsByStoreID(ctx, storeID)
}

func (h *ReviewHandler) CreateReview(ctx context.Context, storeID int64, userID string, cmd CreateReviewCommand) (*domain.Review, error) {
	if userID == "" {
		return nil, usecase.ErrUnauthorized
	}

	return h.reviewUseCase.CreateReview(ctx, storeID, userID, cmd.toInput(userID))
}
