package usecase

import (
	"context"
	"strings"
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
func NewUserUseCase(userRepo output.UserRepository, reviewRepo output.ReviewRepository) input.UserUseCase {
	return &userUseCase{
		userRepo:   userRepo,
		reviewRepo: reviewRepo,
	}
}

func (uc *userUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	return mustFindUser(ctx, uc.userRepo, userID)
}

func (uc *userUseCase) EnsureUser(ctx context.Context, input input.EnsureUserInput) (entity.User, error) {
	if input.UserID == "" {
		return entity.User{}, ErrInvalidInput
	}

	provider := normalizeProvider(input.Provider)

	user, err := uc.userRepo.FindByID(ctx, input.UserID)
	if err == nil {
		if shouldUpdateProvider(user.Provider, provider) {
			user.Provider = provider
			user.UpdatedAt = time.Now()
			if err := uc.userRepo.Update(ctx, user); err != nil {
				return entity.User{}, err
			}
		}
		return user, nil
	}
	if !apperr.IsCode(err, apperr.CodeNotFound) {
		return entity.User{}, err
	}

	email := strings.ToLower(strings.TrimSpace(input.Email))
	if email == "" {
		return entity.User{}, ErrInvalidInput
	}

	role := strings.ToLower(strings.TrimSpace(input.Role))
	if !IsValidRole(role) {
		role = "user"
	}

	name := deriveNameFromEmail(email)
	now := time.Now()
	newUser := &entity.User{
		UserID:    input.UserID,
		Name:      name,
		Email:     email,
		Provider:  provider,
		Role:      role,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.userRepo.Create(ctx, newUser); err != nil {
		existing, fetchErr := uc.userRepo.FindByID(ctx, input.UserID)
		if fetchErr == nil {
			if shouldUpdateProvider(existing.Provider, provider) {
				existing.Provider = provider
				existing.UpdatedAt = time.Now()
				if err := uc.userRepo.Update(ctx, existing); err != nil {
					return entity.User{}, err
				}
			}
			return existing, nil
		}
		return entity.User{}, err
	}

	return *newUser, nil
}

func (uc *userUseCase) UpdateUser(ctx context.Context, userID string, input input.UpdateUserInput) (entity.User, error) {
	user, err := mustFindUser(ctx, uc.userRepo, userID)
	if err != nil {
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
	if !IsValidRole(role) {
		return ErrInvalidRole
	}

	// ユーザーの存在確認
	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return err
	}

	return uc.userRepo.UpdateRole(ctx, userID, role)
}

func (uc *userUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	// ユーザーの存在確認
	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return nil, err
	}

	return uc.reviewRepo.FindByUserID(ctx, userID)
}

func deriveNameFromEmail(email string) string {
	local := strings.TrimSpace(email)
	if local == "" {
		return "user"
	}
	if at := strings.Index(local, "@"); at >= 0 {
		local = local[:at]
	}
	local = strings.TrimSpace(local)
	if local == "" {
		return "user"
	}
	return local
}

func normalizeProvider(provider string) string {
	trimmed := strings.ToLower(strings.TrimSpace(provider))
	validProviders := map[string]bool{
		"google": true,
		"apple":  true,
		"email":  true,
		"oauth":  true,
	}
	if !validProviders[trimmed] {
		return "oauth"
	}
	return trimmed
}

func shouldUpdateProvider(current string, incoming string) bool {
	if incoming == "" || incoming == "oauth" {
		return false
	}
	currentTrimmed := strings.ToLower(strings.TrimSpace(current))
	return currentTrimmed == "" || currentTrimmed == "oauth"
}
