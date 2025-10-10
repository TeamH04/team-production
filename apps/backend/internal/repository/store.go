package repository

import (
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

type storeRepository struct{ db *gorm.DB }

func NewStoreRepository(db *gorm.DB) *storeRepository { return &storeRepository{db: db} }

func (r *storeRepository) List() ([]domain.Store, error) {
	var out []domain.Store
	if err := r.db.Order("store_id DESC").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *storeRepository) GetByID(id int64) (domain.Store, bool, error) {
	var s domain.Store
	if err := r.db.Where("store_id = ?", id).First(&s).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.Store{}, false, nil
		}
		return domain.Store{}, false, err
	}
	return s, true, nil
}

func (r *storeRepository) Create(s domain.Store) (domain.Store, error) {
	if err := r.db.Create(&s).Error; err != nil {
		return domain.Store{}, err
	}
	return s, nil
}
