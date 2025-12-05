package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// UserRepository abstracts user persistence boundary.
type UserRepository interface {
	FindByID(ctx context.Context, userID string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	Update(ctx context.Context, user *domain.User) error
	UpdateRole(ctx context.Context, userID string, role string) error
}
