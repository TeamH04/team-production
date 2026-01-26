package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

type StationUseCase interface {
	ListStations(ctx context.Context) ([]entity.Station, error)
}
