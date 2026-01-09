package middleware

import (
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AuthMiddleware struct {
	userUC input.UserUseCase
}

func NewAuthMiddleware(userUC input.UserUseCase) *AuthMiddleware {
	return &AuthMiddleware{userUC}
}

// JWTAuth はJWT認証を行うミドルウェア
func (m *AuthMiddleware) JWTAuth(verifier security.TokenVerifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
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
			// Authorizationヘッダーを取得
			auth := c.Request().Header.Get("Authorization")
			if auth == "" {
				return presentation.NewUnauthorized("missing authorization header")
			}

			// Bearerトークンを抽出
			parts := strings.Split(auth, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return presentation.NewUnauthorized("invalid authorization format")
			}

			token := parts[1]

			claims, err := verifier.Verify(token)
			if err != nil {
				return presentation.NewUnauthorized(err.Error())
			}

			user, err := m.userUC.FindByID(c.Request().Context(), claims.UserID)
			if err != nil {
				return presentation.NewUnauthorized("user not found")
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
			auth := c.Request().Header.Get("Authorization")
			if auth != "" {
				parts := strings.Split(auth, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token := parts[1]
					if verifier != nil {
						if claims, err := verifier.Verify(token); err == nil {
							user, err := m.userUC.FindByID(c.Request().Context(), claims.UserID)
							if err == nil {
								requestcontext.SetToContext(c, user, claims.Role)
							}
						}
					}
				}
			}
			return next(c)
		}
	}
}
