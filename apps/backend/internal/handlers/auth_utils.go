package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// AuthUtils は JWT検証や権限チェックを提供するユーティリティ構造体です。
type AuthUtils struct {
	DB *gorm.DB
}

// NewAuthUtils は AuthUtils のコンストラクタです。
func NewAuthUtils(db *gorm.DB) *AuthUtils {
	return &AuthUtils{DB: db}
}

// --- JWT検証（共通処理） ---
func (a *AuthUtils) verifyToken(c echo.Context) (*domain.User, error) {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid authorization header")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "JWT secret not configured")
	}

	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid token claims")
	}

	sub, ok := claims["sub"].(string)
	if !ok || sub == "" {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "missing user id in token")
	}

	var user domain.User
	if err := a.DB.First(&user, "user_id = ?", sub).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "user not found")
		}
		return nil, echo.NewHTTPError(http.StatusInternalServerError, "failed to verify user")
	}

	return &user, nil
}

// --- ロール別チェック ---

// RequireAdmin は管理者権限を要求します。
func (a *AuthUtils) RequireAdmin(c echo.Context) (*domain.User, error) {
	user, err := a.verifyToken(c)
	if err != nil {
		return nil, err
	}
	if user.Role != "admin" {
		return nil, echo.NewHTTPError(http.StatusForbidden, "admin privileges required")
	}
	return user, nil
}

// RequireOwner はオーナー（または管理者）権限を要求します。
func (a *AuthUtils) RequireOwner(c echo.Context) (*domain.User, error) {
	user, err := a.verifyToken(c)
	if err != nil {
		return nil, err
	}
	if user.Role != "owner" && user.Role != "admin" {
		return nil, echo.NewHTTPError(http.StatusForbidden, "owner privileges required")
	}
	return user, nil
}

// RequireUser はログイン済みユーザーであることのみを要求します。
func (a *AuthUtils) RequireUser(c echo.Context) (*domain.User, error) {
	user, err := a.verifyToken(c)
	if err != nil {
		return nil, err
	}
	return user, nil
}
