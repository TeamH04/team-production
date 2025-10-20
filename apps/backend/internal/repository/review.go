package repository

import (
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

type reviewRepository struct{ db *gorm.DB }

func NewReviewRepository(db *gorm.DB) *reviewRepository { return &reviewRepository{db: db} }

func (r *reviewRepository) Create(rv domain.Review) (domain.Review, error) {
	if err := r.db.Create(&rv).Error; err != nil {
		return domain.Review{}, err
	}
	return rv, nil
}
