package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/input_port"
	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type FavoriteHandler struct {
	favoriteUseCase usecase.FavoriteUseCase
}

// NewFavoriteHandler は FavoriteHandler を生成します
func NewFavoriteHandler(favoriteUseCase usecase.FavoriteUseCase) *FavoriteHandler {
	return &FavoriteHandler{
		favoriteUseCase: favoriteUseCase,
	}
}

// GetUserFavorites はユーザーのお気に入り一覧を取得します
// GET /api/users/:id/favorites
func (h *FavoriteHandler) GetUserFavorites(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")

	favorites, err := h.favoriteUseCase.GetUserFavorites(ctx, userID)
	if err != nil {
		if errors.Is(err, usecase.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, favorites)
}

// AddFavorite はお気に入りを追加します
// POST /api/users/:id/favorites
func (h *FavoriteHandler) AddFavorite(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	// 本人確認
	if userID != currentUserID {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "permission denied"})
	}

	var req input_port.AddFavoriteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	favorite, err := h.favoriteUseCase.AddFavorite(ctx, userID, req.StoreID)
	if err != nil {
		if errors.Is(err, usecase.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		if errors.Is(err, usecase.ErrAlreadyFavorite) {
			return c.JSON(http.StatusConflict, echo.Map{"error": "already added to favorites"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, favorite)
}

// RemoveFavorite はお気に入りを削除します
// DELETE /api/users/:id/favorites/:store_id
func (h *FavoriteHandler) RemoveFavorite(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	// 本人確認
	if userID != currentUserID {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "permission denied"})
	}

	storeIDStr := c.Param("store_id")
	storeID, err := strconv.ParseInt(storeIDStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store_id"})
	}

	err = h.favoriteUseCase.RemoveFavorite(ctx, userID, storeID)
	if err != nil {
		if errors.Is(err, usecase.ErrFavoriteNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "favorite not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.NoContent(http.StatusNoContent)
}
