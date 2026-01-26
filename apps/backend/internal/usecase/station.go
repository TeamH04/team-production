package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type stationUseCase struct {
	repo output.StationRepository
}

func NewStationUseCase(repo output.StationRepository) input.StationUseCase {
	return &stationUseCase{repo: repo}
}

func (u *stationUseCase) ListStations(ctx context.Context) ([]entity.Station, error) {
	return u.repo.FindAll(ctx)
}
