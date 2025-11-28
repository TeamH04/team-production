package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
)

type UserHandler struct {
	userUseCase interactor.UserUseCase
}

// NewUserHandler は UserHandler を生成します
func NewUserHandler(userUseCase interactor.UserUseCase) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
	}
}

// GetUserByID は指定されたIDのユーザー情報を取得します
// GET /api/users/:id
func (h *UserHandler) GetUserByID(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")

	user, err := h.userUseCase.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, interactor.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, user)
}

// GetMe はログイン中のユーザー情報を取得します
// GET /api/users/me
func (h *UserHandler) GetMe(c echo.Context) error {
	ctx := c.Request().Context()
	userID := middleware.GetUserID(c)

	if userID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "user_id is required"})
	}

	user, err := h.userUseCase.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, interactor.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, user)
}

// UpdateUser はユーザー情報を更新します
// PUT /api/users/:id
func (h *UserHandler) UpdateUser(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")
	currentUserID := middleware.GetUserID(c)

	// 本人確認
	if userID != currentUserID {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "permission denied"})
	}

	var req interactor.UpdateUserInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}

	user, err := h.userUseCase.UpdateUser(ctx, userID, req)
	if err != nil {
		if errors.Is(err, interactor.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, user)
}

// GetUserReviews はユーザーのレビュー一覧を取得します
// GET /api/users/:id/reviews
func (h *UserHandler) GetUserReviews(c echo.Context) error {
	ctx := c.Request().Context()
	userID := c.Param("id")

	reviews, err := h.userUseCase.GetUserReviews(ctx, userID)
	if err != nil {
		if errors.Is(err, interactor.ErrUserNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, reviews)
}
