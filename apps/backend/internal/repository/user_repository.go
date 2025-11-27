package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository は UserRepository の実装を生成します
func NewUserRepository(db *gorm.DB) ports.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, userID string) (*domain.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "user_id = ?", userID).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainUser := model.UserModelToDomain(user)
	return &domainUser, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainUser := model.UserModelToDomain(user)
	return &domainUser, nil
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	record := model.UserModelFromDomain(user)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	user.CreatedAt = record.CreatedAt
	user.UpdatedAt = record.UpdatedAt
	return nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	record := model.UserModelFromDomain(user)
	return mapDBError(r.db.WithContext(ctx).Model(&model.User{UserID: user.UserID}).Updates(record).Error)
}

func (r *userRepository) UpdateRole(ctx context.Context, userID string, role string) error {
	return mapDBError(r.db.WithContext(ctx).Model(&model.User{}).
		Where("user_id = ?", userID).
		Update("role", role).Error)
}
