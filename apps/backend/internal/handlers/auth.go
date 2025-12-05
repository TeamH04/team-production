package handlers

import (
	"context"
	"fmt"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AuthHandler struct {
	authUseCase input.AuthUseCase
	userUseCase input.UserUseCase
}

var _ AuthController = (*AuthHandler)(nil)

type SignupCommand struct {
	Email    string
	Password string
	Name     string
}

func (c SignupCommand) toInput() input.AuthSignupInput {
	return input.AuthSignupInput{
		Email:    c.Email,
		Password: c.Password,
		Name:     c.Name,
	}
}

type LoginCommand struct {
	Email    string
	Password string
}

func (c LoginCommand) toInput() input.AuthLoginInput {
	return input.AuthLoginInput{
		Email:    c.Email,
		Password: c.Password,
	}
}

type UpdateRoleCommand struct {
	Role string
}

// NewAuthHandler は AuthHandler を生成します
func NewAuthHandler(authUseCase input.AuthUseCase, userUseCase input.UserUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
		userUseCase: userUseCase,
	}
}

func (h *AuthHandler) GetMe(ctx context.Context, userID string) (*domain.User, error) {
	if userID == "" {
		return nil, fmt.Errorf("%w: user_id is required", usecase.ErrInvalidInput)
	}

	return h.userUseCase.GetUserByID(ctx, userID)
}

func (h *AuthHandler) UpdateRole(ctx context.Context, userID string, cmd UpdateRoleCommand) error {
	if userID == "" {
		return usecase.ErrUnauthorized
	}

	return h.userUseCase.UpdateUserRole(ctx, userID, cmd.Role)
}

func (h *AuthHandler) Signup(ctx context.Context, cmd SignupCommand) (*domain.User, error) {
	return h.authUseCase.Signup(ctx, cmd.toInput())
}

func (h *AuthHandler) Login(ctx context.Context, cmd LoginCommand) (*input.AuthSession, error) {
	return h.authUseCase.Login(ctx, cmd.toInput())
}
