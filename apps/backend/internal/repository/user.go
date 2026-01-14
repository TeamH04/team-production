package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository は UserRepository の実装を生成します
func NewUserRepository(db *gorm.DB) output.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, userID string) (entity.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "user_id = ?", userID).Error; err != nil {
		return entity.User{}, mapDBError(err)
	}
	domainUser := user.Entity()
	return domainUser, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	var user model.User
	if err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainUser := user.Entity()
	return &domainUser, nil
}

func (r *userRepository) Create(ctx context.Context, user *entity.User) error {
	record := model.User{
		UserID:    user.UserID,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
	if err := r.db.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}
	return nil
}

func (r *userRepository) Update(ctx context.Context, user entity.User) error {
	record := model.User{
		UserID:    user.UserID,
		Email:     user.Email,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
	return mapDBError(r.db.WithContext(ctx).Model(&model.User{UserID: user.UserID}).Updates(record).Error)
}

func (r *userRepository) UpdateRole(ctx context.Context, userID string, role string) error {
	return mapDBError(r.db.WithContext(ctx).Model(&model.User{}).
		Where("user_id = ?", userID).
		Update("role", role).Error)
}
