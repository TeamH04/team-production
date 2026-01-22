package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type AuthSignupInput struct {
	Email    string
	Password string
	Name     string
	Role     string
}

type AuthLoginInput struct {
	Email    string
	Password string
}

// AuthUser is an alias to output.AuthUser to avoid type duplication.
type AuthUser = output.AuthUser

// AuthSession is an alias to output.AuthSession to avoid type duplication.
type AuthSession = output.AuthSession

// AuthUseCase defines inbound port for authentication flows.
type AuthUseCase interface {
	Signup(ctx context.Context, input AuthSignupInput) (*entity.User, error)
	Login(ctx context.Context, input AuthLoginInput) (*AuthSession, error)
}
