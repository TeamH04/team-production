package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// StoreRepository abstracts store persistence boundary.
type StoreRepository interface {
	FindAll(ctx context.Context) ([]entity.Store, error)
	FindByID(ctx context.Context, id string) (*entity.Store, error)
	FindPending(ctx context.Context) ([]entity.Store, error)
	Create(ctx context.Context, store *entity.Store) error
	Update(ctx context.Context, store *entity.Store) error
	Delete(ctx context.Context, id string) error
}
