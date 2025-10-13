package handlers

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct{ uc port.AuthUsecase }

func NewAuthHandler(uc port.AuthUsecase) *AuthHandler { return &AuthHandler{uc: uc} }

// エラーメッセージの定数
const (
	// 認証関連
	errMissingToken      = "Authorization token not provided"
	errInvalidToken      = "Invalid or expired token"
	errInvalidClaims     = "Invalid token claims"
	errMissingAuthHeader = "Missing authorization header"

	// ユーザー関連
	errMissingUserID     = "Missing user ID in token"
	errUserNotFound      = "User not found"
	errInvalidRole       = "Invalid role"
	errMissingEmail      = "Missing email in token"

	// API関連
	errMethodNotAllowed  = "Method not allowed"
	errInvalidJSON       = "Invalid JSON body"
	errRequestTimeout    = "Request timeout"
	errServerError       = "Internal server error"

	// 操作結果
	errLoginFailed       = "Login failed"
	errSignupFailed     = "Signup failed"
	errFailedToUpdate    = "Failed to update role"
)

// ユーザーレスポンスの型定義
type UserResponse struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	Name         string                 `json:"name,omitempty"`
	Picture      string                 `json:"picture,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    *time.Time            `json:"updated_at,omitempty"`
	AppMetadata  map[string]interface{} `json:"app_metadata,omitempty"`
	UserMetadata map[string]interface{} `json:"user_metadata,omitempty"`
}

// POST /api/auth/signup
func (h *AuthHandler) SignUp(c echo.Context) error {
	tokenStr := extractToken(c)
	if tokenStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingAuthHeader)
	}

	claims, err := h.verifyToken(tokenStr)
	if err != nil {
		return err
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, errMissingUserID)
	}
	email, ok := getStringClaim(claims, "email")
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, errMissingEmail)
	}
	name, _ := getStringClaim(claims, "name")
	picture, _ := getStringClaim(claims, "picture")

	var body struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, errInvalidJSON)
	}

	out, err := h.uc.SignUp(port.SignUpInput{UserID: userID, Email: email, Name: name, Picture: picture, Role: body.Role})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, errServerError)
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"status": "success",
		"user":   out,
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	tokenStr := extractToken(c)
	if tokenStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingToken)
	}

	claims, err := h.verifyToken(tokenStr)
	if err != nil {
		return err
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingUserID)
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	email, _ := getStringClaim(claims, "email")
	name, _ := getStringClaim(claims, "name")
	picture, _ := getStringClaim(claims, "picture")

	loginOutput, err := h.uc.Login(ctx, port.LoginInput{
		UserID:  userID,
		Email:   email,
		Name:    name,
		Picture: picture,
	})

	if err != nil {
		switch {
		case errors.Is(err, port.ErrUserNotFound):
			return echo.NewHTTPError(http.StatusNotFound, echo.Map{
				"error": errUserNotFound,
				"hint":  "please sign up first",
			})
		case errors.Is(err, context.DeadlineExceeded):
			return echo.NewHTTPError(http.StatusGatewayTimeout, errRequestTimeout)
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, errServerError)
		}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"status":  "success",
		"message": "Login successful",
		"user":    loginOutput,
		"token": map[string]interface{}{
			"iat": claims["iat"],
			"exp": claims["exp"],
		},
	})
}

// 共通のトークン検証処理
func (h *AuthHandler) verifyToken(tokenStr string) (jwt.MapClaims, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"HS256"}))
	token, err := parser.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil
	})
	if err != nil || !token.Valid {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, errInvalidToken)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, errInvalidClaims)
	}
	return claims, nil
}

// GET /api/auth/me
func (h *AuthHandler) GetMe(c echo.Context) error {
	if c.Request().Method != http.MethodGet {
		return echo.NewHTTPError(http.StatusMethodNotAllowed, errMethodNotAllowed)
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	tokenStr := extractToken(c)
	if tokenStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingToken)
	}

	claims, err := h.verifyToken(tokenStr)
	if err != nil {
		return err
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingUserID)
	}

	user, err := h.uc.GetUser(ctx, userID)
	if err != nil {
		switch {
		case errors.Is(err, context.DeadlineExceeded):
			return echo.NewHTTPError(http.StatusGatewayTimeout, errRequestTimeout)
		case errors.Is(err, port.ErrUserNotFound):
			return echo.NewHTTPError(http.StatusNotFound, errUserNotFound)
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, errServerError)
		}
	}

	appMetadata, _ := claims["app_metadata"].(map[string]interface{})
	userMetadata, _ := claims["user_metadata"].(map[string]interface{})

	email, _ := getStringClaim(claims, "email")

	response := UserResponse{
		ID:           userID,
		Email:        email,
		Role:         user.Role,
		Name:         user.Name,
		Picture:      user.Picture,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    derefTime(user.UpdatedAt),
		AppMetadata:  appMetadata,
		UserMetadata: userMetadata,
	}

	return c.JSON(http.StatusOK, echo.Map{
		"user": response,
		"iat":  claims["iat"],
		"exp":  claims["exp"],
	})
}

// トークン抽出ヘルパー
func extractToken(c echo.Context) string {
	auth := strings.TrimSpace(c.Request().Header.Get("Authorization"))
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	}
	if auth != "" {
		return auth
	}
	cookie, err := c.Cookie("sb-access-token")
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}
	cookie, err = c.Cookie("sb:token")
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}
	return ""
}

// omitempty対応のためのtimeポインタ変換
func derefTime(t *time.Time) *time.Time {
	if t != nil {
		return t
	}
	return nil
}

// PUT /api/auth/role
func (h *AuthHandler) UpdateRole(c echo.Context) error {
	tokenStr := extractToken(c)
	if tokenStr == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingToken)
	}

	claims, err := h.verifyToken(tokenStr)
	if err != nil {
		return err
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok || userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, errMissingUserID)
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, errInvalidJSON)
	}

	if body.Role != "user" && body.Role != "owner" {
		return echo.NewHTTPError(http.StatusBadRequest, errInvalidRole)
	}

	ctx, cancel := context.WithTimeout(c.Request().Context(), 5*time.Second)
	defer cancel()

	err = h.uc.UpdateRole(ctx, userID, body.Role)
	if err != nil {
		switch {
		case errors.Is(err, port.ErrUserNotFound):
			return echo.NewHTTPError(http.StatusNotFound, errUserNotFound)
		case errors.Is(err, context.DeadlineExceeded):
			return echo.NewHTTPError(http.StatusGatewayTimeout, errRequestTimeout)
		default:
			return echo.NewHTTPError(http.StatusInternalServerError, errFailedToUpdate)
		}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"status":  "success",
		"message": "role updated successfully",
		"role":    body.Role,
	})
}

// getStringClaim と getString を統一
func getStringClaim(m jwt.MapClaims, key string) (string, bool) {
	v, ok := m[key]
	if !ok || v == nil {
		return "", false
	}
	s, ok := v.(string)
	return s, ok && s != ""
}
