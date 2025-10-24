package middleware

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

// AuthContext はコンテキストに設定する認証情報のキー
const (
	UserIDKey   = "user_id"
	UserRoleKey = "user_role"
)

// JWTAuth はJWT認証を行うミドルウェア
// 実際にはSupabase JWTの検証を行う
func JWTAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Authorizationヘッダーを取得
			auth := c.Request().Header.Get("Authorization")
			if auth == "" {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "missing authorization header",
				})
			}

			// Bearerトークンを抽出
			parts := strings.Split(auth, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "invalid authorization format",
				})
			}

			token := parts[1]

			// JWTトークンの検証（実際にはSupabase SDKを使用）
			// 仮の実装として、トークンからユーザーIDとロールを抽出
			userID, role := validateToken(token)
			if userID == "" {
				return c.JSON(http.StatusUnauthorized, echo.Map{
					"error": "invalid or expired token",
				})
			}

			// コンテキストにユーザー情報を設定
			c.Set(UserIDKey, userID)
			c.Set(UserRoleKey, role)

			return next(c)
		}
	}
}

// RequireRole は指定されたロールを持つユーザーのみアクセスを許可するミドルウェア
func RequireRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// コンテキストからロールを取得
			userRole, ok := c.Get(UserRoleKey).(string)
			if !ok {
				return c.JSON(http.StatusForbidden, echo.Map{
					"error": "role information not found",
				})
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
				return c.JSON(http.StatusForbidden, echo.Map{
					"error": "insufficient permissions",
				})
			}

			return next(c)
		}
	}
}

// OptionalAuth は認証をオプションにするミドルウェア
// 認証情報があれば設定し、なければスキップ
func OptionalAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			auth := c.Request().Header.Get("Authorization")
			if auth != "" {
				parts := strings.Split(auth, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					token := parts[1]
					userID, role := validateToken(token)
					if userID != "" {
						c.Set(UserIDKey, userID)
						c.Set(UserRoleKey, role)
					}
				}
			}
			return next(c)
		}
	}
}

// validateToken はJWTトークンを検証してユーザーIDとロールを返す
// 実際にはSupabase SDKやJWT検証ライブラリを使用
func validateToken(token string) (userID string, role string) {
	// TODO: 実際のJWT検証処理を実装
	// Supabase JWTの検証
	// 仮の実装として、トークンをそのままユーザーIDとして使用
	if token != "" {
		return token, "user" // 仮のデフォルトロール
	}
	return "", ""
}

// GetUserID はコンテキストからユーザーIDを取得するヘルパー関数
func GetUserID(c echo.Context) string {
	userID, _ := c.Get(UserIDKey).(string)
	return userID
}

// GetUserRole はコンテキストからユーザーロールを取得するヘルパー関数
func GetUserRole(c echo.Context) string {
	role, _ := c.Get(UserRoleKey).(string)
	return role
}
