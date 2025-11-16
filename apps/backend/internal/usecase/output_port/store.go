package output_port

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// StoreRepository はストアのデータアクセスを抽象化するインターフェース
type StoreRepository interface {
	FindAll(ctx context.Context) ([]domain.Store, error)
	FindByID(ctx context.Context, id int64) (*domain.Store, error)
	Create(ctx context.Context, store *domain.Store) error
	Update(ctx context.Context, store *domain.Store) error
	Delete(ctx context.Context, id int64) error
}
