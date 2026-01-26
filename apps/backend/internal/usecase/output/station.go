package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

type StationRepository interface {
	FindAll(ctx context.Context) ([]entity.Station, error)
}
