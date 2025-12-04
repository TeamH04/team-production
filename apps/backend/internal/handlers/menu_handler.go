package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
)

type MenuHandler struct {
	menuUseCase interactor.MenuUseCase
}

// NewMenuHandler は MenuHandler を生成します
func NewMenuHandler(menuUseCase interactor.MenuUseCase) *MenuHandler {
	return &MenuHandler{
		menuUseCase: menuUseCase,
	}
}

// GetMenusByStoreID は指定されたストアのメニューを取得します
// GET /api/stores/:id/menus
func (h *MenuHandler) GetMenusByStoreID(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	menus, err := h.menuUseCase.GetMenusByStoreID(ctx, storeID)
	if err != nil {
		if errors.Is(err, interactor.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, menus)
}

// CreateMenu は新しいメニューを作成します
// POST /api/stores/:id/menus
func (h *MenuHandler) CreateMenu(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var req interactor.CreateMenuInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	menu, err := h.menuUseCase.CreateMenu(ctx, storeID, req)
	if err != nil {
		if errors.Is(err, interactor.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		if errors.Is(err, interactor.ErrInvalidInput) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, menu)
}
