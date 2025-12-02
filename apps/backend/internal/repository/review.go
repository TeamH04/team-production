package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"gorm.io/gorm"
)

type reviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository は ReviewRepository の実装を生成します
func NewReviewRepository(db *gorm.DB) ports.ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) FindByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error) {
	var reviews []model.Review
	if err := r.db.WithContext(ctx).
		Where("store_id = ?", storeID).
		Order("posted_at desc").
		Find(&reviews).Error; err != nil {
		return nil, mapDBError(err)
	}
	result := make([]domain.Review, len(reviews))
	for i, review := range reviews {
		result[i] = model.ReviewModelToDomain(review)
	}
	return result, nil
}

func (r *reviewRepository) Create(ctx context.Context, review *domain.Review) error {
	record := model.ReviewModelFromDomain(review)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	review.ReviewID = record.ReviewID
	review.PostedAt = record.PostedAt
	review.CreatedAt = record.CreatedAt
	return nil
}

func (r *reviewRepository) FindByUserID(ctx context.Context, userID string) ([]domain.Review, error) {
	var reviews []model.Review
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("posted_at desc").
		Find(&reviews).Error; err != nil {
		return nil, mapDBError(err)
	}

	result := make([]domain.Review, len(reviews))
	for i, review := range reviews {
		result[i] = model.ReviewModelToDomain(review)
	}
	return result, nil
}
