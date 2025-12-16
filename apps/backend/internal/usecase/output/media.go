package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// MediaRepository abstracts media persistence boundary.
type MediaRepository interface {
	FindByID(ctx context.Context, mediaID int64) (*domain.Media, error)
	Create(ctx context.Context, media *domain.Media) error
}
