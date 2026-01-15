package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// FileRepository abstracts file persistence boundary.
type FileRepository interface {
	FindByStoreAndIDs(ctx context.Context, storeID string, fileIDs []string) ([]entity.File, error)
	Create(ctx context.Context, file *entity.File) error
	LinkToStore(ctx context.Context, storeID string, fileID string) error
}
