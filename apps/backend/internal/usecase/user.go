package usecase

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type userUseCase struct {
	userRepo   output.UserRepository
	reviewRepo output.ReviewRepository
}

// NewUserUseCase は UserUseCase の実装を生成します
func NewUserUseCase(userRepo output.UserRepository, reviewRepo output.ReviewRepository) *userUseCase {
	return &userUseCase{
		userRepo:   userRepo,
		reviewRepo: reviewRepo,
	}
}

func (uc *userUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return entity.User{}, ErrUserNotFound
		}
		return entity.User{}, err
	}
	return user, nil
}

func (uc *userUseCase) UpdateUser(ctx context.Context, userID string, input input.UpdateUserInput) (entity.User, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return entity.User{}, ErrUserNotFound
		}
		return entity.User{}, err
	}

	// 更新フィールドの適用
	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.IconURL != nil {
		user.IconURL = input.IconURL
	}
	if input.IconFileID != nil {
		user.IconFileID = input.IconFileID
	}
	if input.Gender != nil {
		user.Gender = input.Gender
	}
	if input.Birthday != nil {
		user.Birthday = input.Birthday
	}
	user.UpdatedAt = time.Now()

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return entity.User{}, err
	}

	return user, nil
}

func (uc *userUseCase) UpdateUserRole(ctx context.Context, userID string, role string) error {
	// ロールのバリデーション
	validRoles := map[string]bool{
		"user":  true,
		"owner": true,
		"admin": true,
	}
	if !validRoles[role] {
		return ErrInvalidRole
	}

	// ユーザーの存在確認
	if _, err := uc.userRepo.FindByID(ctx, userID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrUserNotFound
		}
		return err
	}

	return uc.userRepo.UpdateRole(ctx, userID, role)
}

func (uc *userUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	// ユーザーの存在確認
	if _, err := uc.userRepo.FindByID(ctx, userID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	return uc.reviewRepo.FindByUserID(ctx, userID)
}
