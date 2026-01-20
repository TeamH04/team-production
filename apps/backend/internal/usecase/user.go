package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/constants"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
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
	incomingName := strings.TrimSpace(input.Name)
	incomingIconURL := strings.TrimSpace(input.IconURL)
	incomingGender := strings.TrimSpace(input.Gender)

	params := profileUpdateParams{
		name:    incomingName,
		iconURL: incomingIconURL,
		gender:  incomingGender,
	}

	user, err := uc.userRepo.FindByID(ctx, input.UserID)
	if err == nil {
		if applyProfileUpdates(&user, provider, params) {
			user.UpdatedAt = time.Now()
			if updateErr := uc.userRepo.Update(ctx, user); updateErr != nil {
				return entity.User{}, updateErr
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

	userRole := strings.ToLower(strings.TrimSpace(input.Role))
	if !IsValidRole(userRole) {
		userRole = role.User
	}

	name := incomingName
	if name == "" {
		name = deriveNameFromEmail(email)
	}
	var iconURL *string
	if incomingIconURL != "" {
		iconURL = &incomingIconURL
	}
	var gender *string
	if incomingGender != "" {
		gender = &incomingGender
	}
	now := time.Now()
	newUser := &entity.User{
		UserID:    input.UserID,
		Name:      name,
		Email:     email,
		IconURL:   iconURL,
		Provider:  provider,
		Gender:    gender,
		Role:      userRole,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.userRepo.Create(ctx, newUser); err != nil {
		existing, fetchErr := uc.userRepo.FindByID(ctx, input.UserID)
		if fetchErr == nil {
			if applyProfileUpdates(&existing, provider, params) {
				existing.UpdatedAt = time.Now()
				if updateErr := uc.userRepo.Update(ctx, existing); updateErr != nil {
					return entity.User{}, updateErr
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

	if input.Name != nil {
		user.Name = *input.Name
	}
	if input.Phone != nil {
		user.Phone = input.Phone
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
	if !IsValidRole(role) {
		return ErrInvalidRole
	}

	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return err
	}

	return uc.userRepo.UpdateRole(ctx, userID, role)
}

func (uc *userUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	if err := ensureUserExists(ctx, uc.userRepo, userID); err != nil {
		return nil, err
	}

	return uc.reviewRepo.FindByUserID(ctx, userID)
}

func deriveNameFromEmail(email string) string {
	local := strings.TrimSpace(email)
	if local == "" {
		return constants.DefaultUserName
	}
	if at := strings.Index(local, "@"); at >= 0 {
		local = local[:at]
	}
	local = strings.TrimSpace(local)
	if local == "" {
		return constants.DefaultUserName
	}
	return local
}

func normalizeProvider(provider string) string {
	trimmed := strings.ToLower(strings.TrimSpace(provider))
	validProviders := map[string]bool{
		constants.ProviderGoogle: true,
		constants.ProviderApple:  true,
		constants.ProviderEmail:  true,
		constants.ProviderOAuth:  true,
	}
	if !validProviders[trimmed] {
		return constants.ProviderOAuth
	}
	return trimmed
}

func shouldUpdateProvider(current string, incoming string) bool {
	if incoming == "" || incoming == constants.ProviderOAuth {
		return false
	}
	currentTrimmed := strings.ToLower(strings.TrimSpace(current))
	return currentTrimmed == "" || currentTrimmed == constants.ProviderOAuth
}

func shouldUpdateName(current string, incoming string, email string) bool {
	incomingTrimmed := strings.TrimSpace(incoming)
	if incomingTrimmed == "" {
		return false
	}
	currentTrimmed := strings.TrimSpace(current)
	if currentTrimmed == "" {
		return true
	}
	derived := deriveNameFromEmail(strings.ToLower(strings.TrimSpace(email)))
	return strings.EqualFold(currentTrimmed, derived)
}

func isEmptyStringPtr(value *string) bool {
	if value == nil {
		return true
	}
	return strings.TrimSpace(*value) == ""
}

type profileUpdateParams struct {
	name    string
	iconURL string
	gender  string
}

func applyProfileUpdates(user *entity.User, provider string, params profileUpdateParams) bool {
	updated := false
	if shouldUpdateProvider(user.Provider, provider) {
		user.Provider = provider
		updated = true
	}
	if shouldUpdateName(user.Name, params.name, user.Email) {
		user.Name = params.name
		updated = true
	}
	if params.iconURL != "" && user.IconFileID == nil && isEmptyStringPtr(user.IconURL) {
		iconURL := params.iconURL
		user.IconURL = &iconURL
		updated = true
	}
	if params.gender != "" && isEmptyStringPtr(user.Gender) {
		gender := params.gender
		user.Gender = &gender
		updated = true
	}
	return updated
}
