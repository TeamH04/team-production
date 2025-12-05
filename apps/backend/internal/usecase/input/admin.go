package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// AdminUseCase defines inbound port for admin operations.
type AdminUseCase interface {
	GetPendingStores(ctx context.Context) ([]domain.Store, error)
	ApproveStore(ctx context.Context, storeID int64) error
	RejectStore(ctx context.Context, storeID int64) error
}
