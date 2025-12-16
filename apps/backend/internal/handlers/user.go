package handlers

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type UserHandler struct {
	userUseCase input.UserUseCase
}

var _ UserController = (*UserHandler)(nil)

type UpdateUserCommand struct {
	Name     *string
	IconURL  *string
	Gender   *string
	Birthday *time.Time
}

func (c UpdateUserCommand) toInput() input.UpdateUserInput {
	return input.UpdateUserInput{
		Name:     c.Name,
		IconURL:  c.IconURL,
		Gender:   c.Gender,
		Birthday: c.Birthday,
	}
}

func NewUserHandler(userUseCase input.UserUseCase) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
	}
}

func (h *UserHandler) GetMe(ctx context.Context, userID string) (*domain.User, error) {
	if userID == "" {
		return nil, usecase.ErrUnauthorized
	}
	return h.userUseCase.GetUserByID(ctx, userID)
}

func (h *UserHandler) UpdateUser(ctx context.Context, userID, requesterID string, cmd UpdateUserCommand) (*domain.User, error) {
	if userID != requesterID {
		return nil, usecase.ErrForbidden
	}

	return h.userUseCase.UpdateUser(ctx, userID, cmd.toInput())
}

func (h *UserHandler) GetUserReviews(ctx context.Context, userID string) ([]domain.Review, error) {
	return h.userUseCase.GetUserReviews(ctx, userID)
}
