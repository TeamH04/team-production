package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type MenuHandler struct {
	menuUseCase input.MenuUseCase
}

func NewMenuHandler(menuUseCase input.MenuUseCase) *MenuHandler {
	return &MenuHandler{
		menuUseCase: menuUseCase,
	}
}

func (h *MenuHandler) GetMenusByStoreID(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", ErrMsgInvalidStoreID)
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
	storeID, err := parseUUIDParam(c, "id", ErrMsgInvalidStoreID)
	if err != nil {
		return err
	}
	var dto createMenuDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}
	menu, err := h.menuUseCase.CreateMenu(c.Request().Context(), storeID, dto.toInput())
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

func (dto createMenuDTO) toInput() input.CreateMenuInput {
	return input.CreateMenuInput{
		Name:        dto.Name,
		Price:       dto.Price,
		Description: dto.Description,
	}
}
