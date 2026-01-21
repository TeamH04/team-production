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
	userRepo    output.UserRepository
	transaction output.Transaction
	authAdmin   output.OwnerAuthAdmin
}

// NewOwnerUseCase creates an OwnerUseCase implementation.
func NewOwnerUseCase(
	userRepo output.UserRepository,
	transaction output.Transaction,
	authAdmin output.OwnerAuthAdmin,
) input.OwnerUseCase {
	return &ownerUseCase{
		userRepo:    userRepo,
		transaction: transaction,
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

	if uc.transaction == nil {
		return nil, output.ErrInvalidTransaction
	}

	// Fetch a full snapshot before the transaction because UpdateInTx persists a full record.
	currentUser, err := mustFindUser(ctx, uc.userRepo, user.UserID)
	if err != nil {
		return nil, err
	}

	var updatedUser entity.User
	if err := uc.transaction.StartTransaction(func(tx interface{}) error {
		updatedUser = currentUser
		updatedUser.Role = role.Owner
		updatedUser.Name = contactName
		if phoneProvided {
			if phone == "" {
				updatedUser.Phone = nil
			} else {
				p := phone
				updatedUser.Phone = &p
			}
		}
		updatedUser.UpdatedAt = time.Now()
		if err := uc.userRepo.UpdateInTx(ctx, tx, updatedUser); err != nil {
			return err
		}
		return nil
	}); err != nil {
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
