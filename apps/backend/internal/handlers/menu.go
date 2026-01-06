package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type MenuHandler struct {
	menuUseCase input.MenuUseCase
}

type CreateMenuCommand struct {
	Name        string
	Price       *int
	Description *string
}

func (c CreateMenuCommand) toInput() input.CreateMenuInput {
	return input.CreateMenuInput{
		Name:        c.Name,
		Price:       c.Price,
		Description: c.Description,
	}
}

func NewMenuHandler(menuUseCase input.MenuUseCase) *MenuHandler {
	return &MenuHandler{
		menuUseCase: menuUseCase,
	}
}

func (h *MenuHandler) GetMenusByStoreID(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	menus, err := h.menuUseCase.GetMenusByStoreID(c.Request().Context(), storeID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewMenuResponses(menus))
}

func (h *MenuHandler) CreateMenu(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	var dto createMenuDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	menu, err := h.menuUseCase.CreateMenu(c.Request().Context(), storeID, dto.toCommand().toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewMenuResponse(*menu)
	return c.JSON(http.StatusCreated, resp)
}

type createMenuDTO struct {
	Name        string  `json:"name"`
	Price       *int    `json:"price"`
	Description *string `json:"description"`
}

func (dto createMenuDTO) toCommand() CreateMenuCommand {
	return CreateMenuCommand{
		Name:        dto.Name,
		Price:       dto.Price,
		Description: dto.Description,
	}
}
