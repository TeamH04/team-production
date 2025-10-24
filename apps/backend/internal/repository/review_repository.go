package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// ReviewRepository はレビューのデータアクセスを抽象化するインターフェース
type ReviewRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	Create(ctx context.Context, review *domain.Review) error
}

type reviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository は ReviewRepository の実装を生成します
func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) FindByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error) {
	var reviews []domain.Review
	if err := r.db.WithContext(ctx).
		Where("store_id = ?", storeID).
		Order("posted_at desc").
		Find(&reviews).Error; err != nil {
		return nil, err
	}
	return reviews, nil
}

func (r *reviewRepository) Create(ctx context.Context, review *domain.Review) error {
	return r.db.WithContext(ctx).Create(review).Error
}
