package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// OwnerSignupCompleteInput represents the payload for finalizing owner signup.
type OwnerSignupCompleteInput struct {
	ContactName string
	StoreName   string
	OpeningDate string
	Phone       *string
}

// OwnerUseCase defines owner-related flows.
type OwnerUseCase interface {
	Complete(ctx context.Context, user entity.User, input OwnerSignupCompleteInput) (*entity.User, error)
}
