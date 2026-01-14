package input

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// UserUseCase defines inbound port for user operations.
type UserUseCase interface {
	FindByID(ctx context.Context, userID string) (entity.User, error)
	EnsureUser(ctx context.Context, input EnsureUserInput) (entity.User, error)
	UpdateUser(ctx context.Context, userID string, input UpdateUserInput) (entity.User, error)
	UpdateUserRole(ctx context.Context, userID string, role string) error
	GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error)
}

type EnsureUserInput struct {
	UserID string
	Email  string
	Role   string
	Provider string
}

type UpdateUserInput struct {
	Name       *string
	IconURL    *string
	IconFileID *string
	Gender     *string
	Birthday   *time.Time
}
