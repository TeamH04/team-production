package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// AdminUseCase defines inbound port for admin operations.
type AdminUseCase interface {
	GetPendingStores(ctx context.Context) ([]entity.Store, error)
	ApproveStore(ctx context.Context, storeID string) error
	RejectStore(ctx context.Context, storeID string) error
}
