package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
)

type MenuHandler struct {
	controller handlers.MenuController
}

func NewMenuHandler(controller handlers.MenuController) *MenuHandler {
	return &MenuHandler{controller: controller}
}

func (h *MenuHandler) GetMenusByStoreID(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	menus, err := h.controller.GetMenusByStoreID(c.Request().Context(), storeID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewMenuResponses(menus))
}

type createMenuDTO struct {
	Name        string  `json:"name"`
	Price       *int    `json:"price"`
	ImageURL    *string `json:"image_url"`
	Description *string `json:"description"`
}

func (dto createMenuDTO) toCommand() handlers.CreateMenuCommand {
	return handlers.CreateMenuCommand{
		Name:        dto.Name,
		Price:       dto.Price,
		ImageURL:    dto.ImageURL,
		Description: dto.Description,
	}
}

func (h *MenuHandler) CreateMenu(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	var dto createMenuDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	menu, err := h.controller.CreateMenu(c.Request().Context(), storeID, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewMenuResponse(*menu)
	return c.JSON(http.StatusCreated, resp)
}
