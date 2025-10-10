package handlers

import (
	"net/http"
	"os"
	"strings"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct{ uc port.AuthUsecase }

func NewAuthHandler(uc port.AuthUsecase) *AuthHandler { return &AuthHandler{uc: uc} }

// POST /api/auth/signup
func (h *AuthHandler) SignUp(c echo.Context) error {
	authHeader := c.Request().Header.Get("Authorization")
	if authHeader == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "missing authorization header"})
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")

	parsed, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) { return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil })
	if err != nil || !parsed.Valid {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token"})
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid claims"})
	}

	userID, _ := claims["sub"].(string)
	email, _ := claims["email"].(string)
	name, _ := claims["name"].(string)
	picture, _ := claims["picture"].(string)
	if userID == "" || email == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing user info in token"})
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	out, err := h.uc.SignUp(port.SignUpInput{UserID: userID, Email: email, Name: name, Picture: picture, Role: body.Role})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, out)
}
