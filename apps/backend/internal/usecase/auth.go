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

type AuthProvider = output.AuthProvider

// AuthUseCase は認証フローを司るユースケースです。
type AuthUseCase interface {
	Signup(ctx context.Context, input input.AuthSignupInput) (*entity.User, error)
	Login(ctx context.Context, input input.AuthLoginInput) (*input.AuthSession, error)
}

type authUseCase struct {
	authProvider AuthProvider
	userRepo     output.UserRepository
}

// NewAuthUseCase は AuthUseCase 実装を返します。
func NewAuthUseCase(authProvider AuthProvider, userRepo output.UserRepository) AuthUseCase {
	return &authUseCase{
		authProvider: authProvider,
		userRepo:     userRepo,
	}
}

func (uc *authUseCase) Signup(ctx context.Context, input input.AuthSignupInput) (*entity.User, error) {
	if err := validateSignupInput(input); err != nil {
		return nil, err
	}

	providerInput := output.AuthSignupInput{
		Email:    input.Email,
		Password: input.Password,
		Name:     input.Name,
	}

	if _, err := uc.userRepo.FindByEmail(ctx, strings.ToLower(input.Email)); err == nil {
		return nil, ErrUserAlreadyExists
	} else if !apperr.IsCode(err, apperr.CodeNotFound) {
		return nil, err
	}

	authUser, err := uc.authProvider.Signup(ctx, providerInput)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := &entity.User{
		UserID:    authUser.ID,
		Name:      input.Name,
		Email:     strings.ToLower(authUser.Email),
		Provider:  "email",
		Role:      authUser.Role,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *authUseCase) Login(ctx context.Context, input input.AuthLoginInput) (*input.AuthSession, error) {
	if err := validateLoginInput(input); err != nil {
		return nil, err
	}
	session, err := uc.authProvider.Login(ctx, output.AuthLoginInput{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		return nil, err
	}
	return newAuthSession(session), nil
}

func validateSignupInput(input input.AuthSignupInput) error {
	if input.Email == "" || input.Password == "" || input.Name == "" {
		return ErrInvalidInput
	}
	if len(input.Password) < 6 {
		return ErrInvalidInput
	}
	return nil
}

func validateLoginInput(input input.AuthLoginInput) error {
	if input.Email == "" || input.Password == "" {
		return ErrInvalidInput
	}
	return nil
}

func newAuthSession(session *output.AuthSession) *input.AuthSession {
	if session == nil {
		return nil
	}
	return &input.AuthSession{
		AccessToken:  session.AccessToken,
		RefreshToken: session.RefreshToken,
		TokenType:    session.TokenType,
		ExpiresIn:    session.ExpiresIn,
		User: input.AuthUser{
			ID:    session.User.ID,
			Email: session.User.Email,
			Role:  session.User.Role,
		},
	}
}
