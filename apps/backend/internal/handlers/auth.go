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

	parsed := &jwt.Token{}
	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "unexpected signing method")
		}
		return []byte(os.Getenv("SUPABASE_JWT_SECRET")), nil
	})
	if err != nil || !parsed.Valid {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid token"})
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid claims"})
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing sub in token"})
	}
	email, ok := getStringClaim(claims, "email")
	if !ok {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing email in token"})
	}
	name, _ := getStringClaim(claims, "name")       // optional
	picture, _ := getStringClaim(claims, "picture") // optional

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

func getStringClaim(m jwt.MapClaims, key string) (string, bool) {
	v, ok := m[key]
	if !ok || v == nil {
		return "", false
	}
	s, ok := v.(string)
	return s, ok && s != ""
}
