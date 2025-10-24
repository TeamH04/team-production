package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// MediaRepository はメディアのデータアクセスを抽象化するインターフェース
type MediaRepository interface {
	FindByID(ctx context.Context, mediaID int64) (*domain.Media, error)
	Create(ctx context.Context, media *domain.Media) error
}

type mediaRepository struct {
	db *gorm.DB
}

// NewMediaRepository は MediaRepository の実装を生成します
func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) FindByID(ctx context.Context, mediaID int64) (*domain.Media, error) {
	var media domain.Media
	if err := r.db.WithContext(ctx).First(&media, mediaID).Error; err != nil {
		return nil, err
	}
	return &media, nil
}

func (r *mediaRepository) Create(ctx context.Context, media *domain.Media) error {
	return r.db.WithContext(ctx).Create(media).Error
}
