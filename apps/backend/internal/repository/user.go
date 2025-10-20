package repository

import (
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

type userRepository struct{ db *gorm.DB }

func NewUserRepository(db *gorm.DB) *userRepository { return &userRepository{db: db} }

func (r *userRepository) FindByID(id string) (domain.User, bool, error) {
	var u domain.User
	if err := r.db.Where("user_id = ?", id).First(&u).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return domain.User{}, false, nil
		}
		return domain.User{}, false, err
	}
	return u, true, nil
}

func (r *userRepository) Create(u domain.User) (domain.User, error) {
	if err := r.db.Create(&u).Error; err != nil {
		return domain.User{}, err
	}
	return u, nil
}
