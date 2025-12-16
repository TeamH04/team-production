package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type MenuHandler struct {
	menuUseCase input.MenuUseCase
}

var _ MenuController = (*MenuHandler)(nil)

type CreateMenuCommand struct {
	Name        string
	Price       *int
	ImageURL    *string
	Description *string
}

func (c CreateMenuCommand) toInput() input.CreateMenuInput {
	return input.CreateMenuInput{
		Name:        c.Name,
		Price:       c.Price,
		ImageURL:    c.ImageURL,
		Description: c.Description,
	}
}

func NewMenuHandler(menuUseCase input.MenuUseCase) *MenuHandler {
	return &MenuHandler{
		menuUseCase: menuUseCase,
	}
}

func (h *MenuHandler) GetMenusByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error) {
	return h.menuUseCase.GetMenusByStoreID(ctx, storeID)
}

func (h *MenuHandler) CreateMenu(ctx context.Context, storeID int64, cmd CreateMenuCommand) (*domain.Menu, error) {
	return h.menuUseCase.CreateMenu(ctx, storeID, cmd.toInput())
}
