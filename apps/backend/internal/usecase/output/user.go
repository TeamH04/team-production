package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// UserRepository abstracts user persistence boundary.
type UserRepository interface {
	FindByID(ctx context.Context, userID string) (entity.User, error)
	FindByEmail(ctx context.Context, email string) (*entity.User, error)
	Create(ctx context.Context, user *entity.User) error
	Update(ctx context.Context, user entity.User) error
	UpdateRole(ctx context.Context, userID string, role string) error
}
