package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type stationRepository struct {
	db *gorm.DB
}

func NewStationRepository(db *gorm.DB) output.StationRepository {
	return &stationRepository{db: db}
}

func (r *stationRepository) FindAll(ctx context.Context) ([]entity.Station, error) {
	var stations []model.Station
	if err := r.db.WithContext(ctx).Find(&stations).Error; err != nil {
		return nil, mapDBError(err)
	}
	return model.ToStationEntities(stations), nil
}
