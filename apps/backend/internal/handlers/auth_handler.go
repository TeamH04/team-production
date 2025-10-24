package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
)

type AuthHandler struct {
	userRepo repository.UserRepository
}

// NewAuthHandler は AuthHandler を生成します
func NewAuthHandler(userRepo repository.UserRepository) *AuthHandler {
	return &AuthHandler{
		userRepo: userRepo,
	}
}

// GetMe はログイン中のユーザー情報を返します
// GET /api/auth/me
func (h *AuthHandler) GetMe(c echo.Context) error {
	ctx := c.Request().Context()
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(ctx, userID)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
	}

	return c.JSON(http.StatusOK, user)
}

// UpdateRole はユーザーのロールを変更します
// PUT /api/auth/role
func (h *AuthHandler) UpdateRole(c echo.Context) error {
	ctx := c.Request().Context()
	userID := middleware.GetUserID(c)

	var req struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	// ロールの検証
	validRoles := map[string]bool{"user": true, "owner": true, "admin": true}
	if !validRoles[req.Role] {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid role"})
	}

	if err := h.userRepo.UpdateRole(ctx, userID, req.Role); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "role updated successfully"})
}

// Signup はユーザー登録を行います（Supabase Auth経由）
// POST /api/auth/signup
func (h *AuthHandler) Signup(c echo.Context) error {
	ctx := c.Request().Context()

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	// TODO: Supabase Authでユーザー登録
	// 仮の実装
	user := &domain.User{
		UserID: "dummy-user-id", // 実際はSupabaseから取得
		Email:  req.Email,
		Name:   req.Name,
		Role:   "user",
	}

	if err := h.userRepo.Create(ctx, user); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "user created successfully",
		"user":    user,
	})
}

// Login はログインを行います（Supabase Auth経由）
// POST /api/auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	// TODO: Supabase Authでログイン処理
	// 仮の実装
	return c.JSON(http.StatusOK, echo.Map{
		"message": "login successful",
		"token":   "dummy-jwt-token",
	})
}
