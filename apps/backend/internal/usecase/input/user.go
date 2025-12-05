package input

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// UserUseCase defines inbound port for user operations.
type UserUseCase interface {
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
	UpdateUser(ctx context.Context, userID string, input UpdateUserInput) (*domain.User, error)
	UpdateUserRole(ctx context.Context, userID string, role string) error
	GetUserReviews(ctx context.Context, userID string) ([]domain.Review, error)
}

type UpdateUserInput struct {
	Name     *string
	IconURL  *string
	Gender   *string
	Birthday *time.Time
}
