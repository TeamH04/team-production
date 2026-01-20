package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type ownerUseCase struct {
	userUseCase input.UserUseCase
	authAdmin   output.OwnerAuthAdmin
}

// NewOwnerUseCase creates an OwnerUseCase implementation.
func NewOwnerUseCase(
	userUseCase input.UserUseCase,
	authAdmin output.OwnerAuthAdmin,
) input.OwnerUseCase {
	return &ownerUseCase{
		userUseCase: userUseCase,
		authAdmin:   authAdmin,
	}
}

func (uc *ownerUseCase) Complete(
	ctx context.Context,
	user entity.User,
	payload input.OwnerSignupCompleteInput,
) (*entity.User, error) {
	contactName := strings.TrimSpace(payload.ContactName)
	storeName := strings.TrimSpace(payload.StoreName)
	openingDate := strings.TrimSpace(payload.OpeningDate)
	phone := ""
	phoneProvided := payload.Phone != nil
	if phoneProvided {
		phone = strings.TrimSpace(*payload.Phone)
	}
	email := strings.TrimSpace(user.Email)

	if err := validateNotEmpty(contactName, storeName, openingDate); err != nil {
		return nil, err
	}
	if !isValidDateYYYYMMDD(openingDate) {
		return nil, ErrInvalidInput
	}
	if email == "" {
		return nil, ErrInvalidInput
	}

	if err := uc.authAdmin.UpdateUser(ctx, user.UserID, output.AuthUserUpdate{
		AppMetadata: map[string]any{
			"role": role.Owner,
		},
		UserMetadata: map[string]any{
			"name": contactName,
		},
	}); err != nil {
		return nil, err
	}

	if err := uc.userUseCase.UpdateUserRole(ctx, user.UserID, role.Owner); err != nil {
		return nil, err
	}

	updateInput := input.UpdateUserInput{}
	updateInput.Name = &contactName
	if phone != "" {
		updateInput.Phone = &phone
	}
	if _, err := uc.userUseCase.UpdateUser(ctx, user.UserID, updateInput); err != nil {
		return nil, err
	}

	updatedUser, err := uc.userUseCase.FindByID(ctx, user.UserID)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}

func isValidDateYYYYMMDD(value string) bool {
	if len(value) != 8 {
		return false
	}
	t, err := time.Parse("20060102", value)
	if err != nil {
		return false
	}
	return t.Format("20060102") == value
}
