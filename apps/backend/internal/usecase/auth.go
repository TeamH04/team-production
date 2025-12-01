package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
)

type AuthProvider = ports.AuthProvider
type AuthSignupInput = ports.AuthSignupInput
type AuthLoginInput = ports.AuthLoginInput

// AuthSession represents an application-level authentication session.
type AuthSession struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int
	User         AuthUser
}

// AuthUser captures the authenticated user's identity.
type AuthUser struct {
	ID    string
	Email string
	Role  string
}

// AuthUseCase は認証フローを司るユースケースです。
type AuthUseCase interface {
	Signup(ctx context.Context, input AuthSignupInput) (*domain.User, error)
	Login(ctx context.Context, input AuthLoginInput) (*AuthSession, error)
}

type authUseCase struct {
	authProvider AuthProvider
	userRepo     ports.UserRepository
}

// NewAuthUseCase は AuthUseCase 実装を返します。
func NewAuthUseCase(authProvider AuthProvider, userRepo ports.UserRepository) AuthUseCase {
	return &authUseCase{
		authProvider: authProvider,
		userRepo:     userRepo,
	}
}

func (uc *authUseCase) Signup(ctx context.Context, input AuthSignupInput) (*domain.User, error) {
	if err := validateSignupInput(input); err != nil {
		return nil, err
	}

	if _, err := uc.userRepo.FindByEmail(ctx, strings.ToLower(input.Email)); err == nil {
		return nil, ErrUserAlreadyExists
	} else if !apperr.IsCode(err, apperr.CodeNotFound) {
		return nil, err
	}

	authUser, err := uc.authProvider.Signup(ctx, input)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := &domain.User{
		UserID:    authUser.ID,
		Name:      input.Name,
		Email:     strings.ToLower(authUser.Email),
		Role:      authUser.Role,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *authUseCase) Login(ctx context.Context, input AuthLoginInput) (*AuthSession, error) {
	if err := validateLoginInput(input); err != nil {
		return nil, err
	}
	session, err := uc.authProvider.Login(ctx, input)
	if err != nil {
		return nil, err
	}
	return newAuthSession(session), nil
}

func validateSignupInput(input AuthSignupInput) error {
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return ErrInvalidInput
	}
	if len(input.Password) < 6 {
		return ErrInvalidInput
	}
	return nil
}

func validateLoginInput(input AuthLoginInput) error {
	if input.Email == "" || input.Password == "" {
		return ErrInvalidInput
	}
	return nil
}

func newAuthSession(session *ports.AuthSession) *AuthSession {
	if session == nil {
		return nil
	}
	return &AuthSession{
		AccessToken:  session.AccessToken,
		RefreshToken: session.RefreshToken,
		TokenType:    session.TokenType,
		ExpiresIn:    session.ExpiresIn,
		User: AuthUser{
			ID:    session.User.ID,
			Email: session.User.Email,
			Role:  session.User.Role,
		},
	}
}
