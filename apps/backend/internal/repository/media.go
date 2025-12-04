package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type mediaRepository struct {
	db *gorm.DB
}

// NewMediaRepository は MediaRepository の実装を生成します
func NewMediaRepository(db *gorm.DB) output.MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) FindByID(ctx context.Context, mediaID int64) (*domain.Media, error) {
	var media model.Media
	if err := r.db.WithContext(ctx).First(&media, mediaID).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainMedia := model.MediaModelToDomain(media)
	return &domainMedia, nil
}

func (r *mediaRepository) Create(ctx context.Context, media *domain.Media) error {
	record := model.MediaModelFromDomain(media)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	media.MediaID = record.MediaID
	media.CreatedAt = record.CreatedAt
	return nil
}
