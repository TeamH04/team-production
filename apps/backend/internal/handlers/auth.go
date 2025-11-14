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
	token, ok := extractBearerToken(c.Request().Header.Get("Authorization"))
	if !ok {
		return JSONError(c, http.StatusUnauthorized, "missing authorization header")
	}

	claims, err := parseJWTClaims(token)
	if err != nil {
		return JSONError(c, http.StatusUnauthorized, err.Error())
	}

	userID, ok := getStringClaim(claims, "sub")
	if !ok {
		return JSONError(c, http.StatusBadRequest, "missing sub in token")
	}
	email, ok := getStringClaim(claims, "email")
	if !ok {
		return JSONError(c, http.StatusBadRequest, "missing email in token")
	}
	name, _ := getStringClaim(claims, "name")       // optional
	picture, _ := getStringClaim(claims, "picture") // optional

	var body struct {
		Role string `json:"role"`
	}
	if err := MustBind(c, &body); err != nil {
		return err
	}

	out, err := h.uc.SignUp(port.SignUpInput{
		UserID:  userID,
		Email:   email,
		Name:    name,
		Picture: picture,
		Role:    body.Role,
	})
	if err != nil {
		return JSONError(c, http.StatusInternalServerError, err.Error())
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

func extractBearerToken(header string) (string, bool) {
	if header == "" {
		return "", false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return "", false
	}
	token := strings.TrimPrefix(header, prefix)
	return token, token != ""
}

func parseJWTClaims(token string) (jwt.MapClaims, error) {
	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "jwt secret not configured")
	}
	claims := jwt.MapClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, echo.NewHTTPError(http.StatusUnauthorized, "unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}
	out, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "invalid claims")
	}
	return out, nil
}
