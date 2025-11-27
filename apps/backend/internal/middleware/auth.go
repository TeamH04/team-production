package middleware

import (
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
)

// JWTAuth はJWT認証を行うミドルウェア
func JWTAuth(verifier security.TokenVerifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
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

			requestcontext.SetUser(c, claims.UserID, claims.Role)

			return next(c)
		}
	}
}

// RequireRole は指定されたロールを持つユーザーのみアクセスを許可するミドルウェア
func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// コンテキストからロールを取得
			userRole := requestcontext.UserRole(c)
			if userRole == "" {
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
func OptionalAuth(verifier security.TokenVerifier) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			auth := c.Request().Header.Get("Authorization")
			if auth != "" {
				parts := strings.Split(auth, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token := parts[1]
					if verifier != nil {
						if claims, err := verifier.Verify(token); err == nil {
							requestcontext.SetUser(c, claims.UserID, claims.Role)
						}
					}
				}
			}
			return next(c)
		}
	}
}
