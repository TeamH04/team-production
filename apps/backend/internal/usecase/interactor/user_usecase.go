package interactor

import (
	"context"
	"errors"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"gorm.io/gorm"
)

// UserUseCase はユーザーに関するビジネスロジックを提供します
type UserUseCase interface {
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
	UpdateUser(ctx context.Context, userID string, input UpdateUserInput) (*domain.User, error)
	UpdateUserRole(ctx context.Context, userID string, role string) error
	GetUserReviews(ctx context.Context, userID string) ([]domain.Review, error)
}

type UpdateUserInput struct {
	Name     *string
	IconURL  *string
	Gender   *string
	Birthday *time.Time
}

type userUseCase struct {
	userRepo   repository.UserRepository
	reviewRepo repository.ReviewRepository
}

// NewUserUseCase は UserUseCase の実装を生成します
func NewUserUseCase(userRepo repository.UserRepository, reviewRepo repository.ReviewRepository) UserUseCase {
	return &userUseCase{
		userRepo:   userRepo,
		reviewRepo: reviewRepo,
	}
}

func (uc *userUseCase) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (uc *userUseCase) UpdateUser(ctx context.Context, userID string, input UpdateUserInput) (*domain.User, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// 更新フィールドの適用
	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.IconURL != nil {
		user.IconURL = input.IconURL
	}
	if input.Gender != nil {
		user.Gender = input.Gender
	}
	if input.Birthday != nil {
		user.Birthday = input.Birthday
	}
	user.UpdatedAt = time.Now()

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
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
	_, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}

	return uc.userRepo.UpdateRole(ctx, userID, role)
}

func (uc *userUseCase) GetUserReviews(ctx context.Context, userID string) ([]domain.Review, error) {
	// ユーザーの存在確認
	_, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// レビューの取得（ReviewRepositoryに新しいメソッドが必要）
	// 仮の実装として空の配列を返す
	return []domain.Review{}, nil
}
