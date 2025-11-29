package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type StoreHandler struct {
	storeUseCase usecase.StoreUseCase
}

// NewStoreHandler は StoreHandler を生成します
func NewStoreHandler(storeUseCase usecase.StoreUseCase) *StoreHandler {
	return &StoreHandler{
		storeUseCase: storeUseCase,
	}
}

// GetStores は全てのストアを取得します
// GET /api/stores
func (h *StoreHandler) GetStores(c echo.Context) error {
	ctx := c.Request().Context()

	stores, err := h.storeUseCase.GetAllStores(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, stores)
}

// GetStoreByID は指定されたIDのストアを取得します
// GET /api/stores/:id
func (h *StoreHandler) GetStoreByID(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}

	store, err := h.storeUseCase.GetStoreByID(ctx, id)
	if err != nil {
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, store)
}

// CreateStore は新しいストアを作成します
// POST /api/stores
func (h *StoreHandler) CreateStore(c echo.Context) error {
	ctx := c.Request().Context()

	var req usecase.CreateStoreInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	store, err := h.storeUseCase.CreateStore(ctx, req)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidInput) || errors.Is(err, usecase.ErrInvalidCoordinates) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, store)
}

// UpdateStore は既存のストアを更新します
// PUT /api/stores/:id
func (h *StoreHandler) UpdateStore(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var req usecase.UpdateStoreInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}

	store, err := h.storeUseCase.UpdateStore(ctx, id, req)
	if err != nil {
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, store)
}

// DeleteStore はストアを削除します
// DELETE /api/stores/:id
func (h *StoreHandler) DeleteStore(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	err = h.storeUseCase.DeleteStore(ctx, id)
	if err != nil {
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete"})
	}

	return c.NoContent(http.StatusNoContent)
}
