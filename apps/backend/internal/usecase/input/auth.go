package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

type AuthSignupInput struct {
	Email    string
	Password string
	Name     string
}

type AuthLoginInput struct {
	Email    string
	Password string
}

type AuthUser struct {
	ID    string
	Email string
	Role  string
}

type AuthSession struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int
	User         AuthUser
}

// AuthUseCase defines inbound port for authentication flows.
type AuthUseCase interface {
	Signup(ctx context.Context, input AuthSignupInput) (*entity.User, error)
	Login(ctx context.Context, input AuthLoginInput) (*AuthSession, error)
}
