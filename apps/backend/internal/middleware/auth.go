package middleware

import (
	"context"
	"errors"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AuthMiddleware struct {
	userUC input.UserUseCase
}

func NewAuthMiddleware(userUC input.UserUseCase) *AuthMiddleware {
	return &AuthMiddleware{userUC}
}

func (m *AuthMiddleware) validateJWTAuthDeps(c echo.Context, verifier security.TokenVerifier) error {
	if m == nil {
		c.Logger().Error("auth middleware: m is nil")
		return presentation.NewInternalServerError("auth middleware: m is nil")
	}
	if m.userUC == nil {
		c.Logger().Error("auth middleware: userUC is nil")
		return presentation.NewInternalServerError("auth middleware: userUC is nil")
	}
	if verifier == nil {
		c.Logger().Error("auth middleware: verifier is nil")
		return presentation.NewInternalServerError("auth middleware: verifier is nil")
	}
	return nil
}

func bearerTokenFromAuthHeader(value string) (string, error) {
	if strings.TrimSpace(value) == "" {
		return "", presentation.NewUnauthorized("missing authorization header")
	}
	// Require "Bearer " prefix for auth middleware
	if !strings.HasPrefix(value, security.BearerPrefix) {
		return "", presentation.NewUnauthorized("invalid authorization format")
	}
	token, err := security.ExtractBearerToken(value)
	if err != nil || token == "" {
		return "", presentation.NewUnauthorized("invalid authorization format")
	}
	return token, nil
}

func (m *AuthMiddleware) findOrEnsureUser(ctx context.Context, claims *security.TokenClaims) (entity.User, error) {
	user, err := m.userUC.FindByID(ctx, claims.UserID)
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, usecase.ErrUserNotFound) {
		return entity.User{}, err
	}
	return m.userUC.EnsureUser(ctx, input.EnsureUserInput{
		UserID:   claims.UserID,
		Email:    claims.Email,
		Role:     claims.Role,
		Provider: claims.Provider,
	})
}

func (m *AuthMiddleware) attachUserIfPossible(c echo.Context, verifier security.TokenVerifier) {
	if m == nil || m.userUC == nil || verifier == nil {
		return
	}
	token, err := bearerTokenFromAuthHeader(c.Request().Header.Get("Authorization"))
	if err != nil {
		return
	}
	claims, err := verifier.Verify(c.Request().Context(), token)
	if err != nil {
		return
	}
	user, err := m.userUC.FindByID(c.Request().Context(), claims.UserID)
	if err != nil {
		return
	}
	requestcontext.SetToContext(c, user, claims.Role)
}

// JWTAuth はJWT認証を行うミドルウェア
func (m *AuthMiddleware) JWTAuth(verifier security.TokenVerifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if err := m.validateJWTAuthDeps(c, verifier); err != nil {
				return err
			}

			token, err := bearerTokenFromAuthHeader(c.Request().Header.Get("Authorization"))
			if err != nil {
				return err
			}

			claims, err := verifier.Verify(c.Request().Context(), token)
			if err != nil {
				return presentation.NewUnauthorized(err.Error())
			}

			user, err := m.findOrEnsureUser(c.Request().Context(), claims)
			if err != nil {
				return err
			}

			requestcontext.SetToContext(c, user, claims.Role)

			return next(c)
		}
	}
}

// RequireRole は指定されたロールを持つユーザーのみアクセスを許可するミドルウェア
func (m *AuthMiddleware) RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// コンテキストからロールを取得
			userRole, err := requestcontext.GetUserRoleFromContext(c.Request().Context())
			if err != nil {
				return presentation.NewForbidden("role information not found")
			}

			// 指定されたロールのいずれかに一致するかチェック
			hasRole := false
			for _, role := range roles {
				if userRole == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				return presentation.NewForbidden("insufficient permissions")
			}

			return next(c)
		}
	}
}

// OptionalAuth は認証をオプションにするミドルウェア
// 認証情報があれば設定し、なければスキップ
func (m *AuthMiddleware) OptionalAuth(verifier security.TokenVerifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			m.attachUserIfPossible(c, verifier)
			return next(c)
		}
	}
}
