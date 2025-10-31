package router

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/TeamH04/team-production/apps/backend/internal/common"
	mw "github.com/TeamH04/team-production/apps/backend/internal/middleware"
)

// NewServer は全てのルーティングとミドルウェアを設定したサーバーを返します
func NewServer(deps *common.Dependencies) *echo.Echo {
	e := echo.New()

	// グローバルミドルウェア
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// ヘルスチェック
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{"status": "ok"})
	})

	// APIルーティング
	setupAPIRoutes(e, deps)

	return e
}

// setupAPIRoutes はAPIのルーティングを設定します
func setupAPIRoutes(e *echo.Echo, deps *common.Dependencies) {
	api := e.Group("/api")

	// 認証エンドポイント
	setupAuthRoutes(api, deps)

	// 店舗関連エンドポイント
	setupStoreRoutes(api, deps)

	// ユーザー関連エンドポイント
	setupUserRoutes(api, deps)

	// お気に入り関連エンドポイント
	setupFavoriteRoutes(api, deps)

	// 通報関連エンドポイント
	setupReportRoutes(api, deps)

	// 管理者用エンドポイント
	setupAdminRoutes(api, deps)

	// メディア関連エンドポイント
	setupMediaRoutes(api, deps)
}

// setupAuthRoutes は認証関連のルーティングを設定します
func setupAuthRoutes(api *echo.Group, deps *common.Dependencies) {
	auth := api.Group("/auth")
	auth.POST("/signup", deps.AuthHandler.Signup)
	auth.POST("/login", deps.AuthHandler.Login)
	auth.GET("/me", deps.AuthHandler.GetMe, mw.JWTAuth())
	auth.PUT("/role", deps.AuthHandler.UpdateRole, mw.JWTAuth())
}

// setupStoreRoutes は店舗関連のルーティングを設定します
func setupStoreRoutes(api *echo.Group, deps *common.Dependencies) {
	// 店舗エンドポイント（一部公開、一部認証必要）
	api.GET("/stores", deps.StoreHandler.GetStores)
	api.GET("/stores/:id", deps.StoreHandler.GetStoreByID)
	api.POST("/stores", deps.StoreHandler.CreateStore, mw.JWTAuth(), mw.RequireRole("owner", "admin"))
	api.PUT("/stores/:id", deps.StoreHandler.UpdateStore, mw.JWTAuth(), mw.RequireRole("owner", "admin"))
	api.DELETE("/stores/:id", deps.StoreHandler.DeleteStore, mw.JWTAuth(), mw.RequireRole("admin"))

	// メニューエンドポイント
	api.GET("/stores/:id/menus", deps.MenuHandler.GetMenusByStoreID)
	api.POST("/stores/:id/menus", deps.MenuHandler.CreateMenu, mw.JWTAuth(), mw.RequireRole("owner", "admin"))

	// レビューエンドポイント
	api.GET("/stores/:id/reviews", deps.ReviewHandler.GetReviewsByStoreID)
	api.POST("/stores/:id/reviews", deps.ReviewHandler.CreateReview, mw.JWTAuth())
}

// setupUserRoutes はユーザー関連のルーティングを設定します
func setupUserRoutes(api *echo.Group, deps *common.Dependencies) {
	api.GET("/users/me", deps.UserHandler.GetMe, mw.JWTAuth())
	api.GET("/users/:id", deps.UserHandler.GetUserByID)
	api.PUT("/users/:id", deps.UserHandler.UpdateUser, mw.JWTAuth())
	api.GET("/users/:id/reviews", deps.UserHandler.GetUserReviews)
}

// setupFavoriteRoutes はお気に入り関連のルーティングを設定します
func setupFavoriteRoutes(api *echo.Group, deps *common.Dependencies) {
	api.GET("/users/:id/favorites", deps.FavoriteHandler.GetUserFavorites)
	api.POST("/users/:id/favorites", deps.FavoriteHandler.AddFavorite, mw.JWTAuth())
	api.DELETE("/users/:id/favorites/:store_id", deps.FavoriteHandler.RemoveFavorite, mw.JWTAuth())
}

// setupReportRoutes は通報関連のルーティングを設定します
func setupReportRoutes(api *echo.Group, deps *common.Dependencies) {
	api.POST("/reports", deps.ReportHandler.CreateReport, mw.JWTAuth())
}

// setupAdminRoutes は管理者用のルーティングを設定します
func setupAdminRoutes(api *echo.Group, deps *common.Dependencies) {
	admin := api.Group("/admin", mw.JWTAuth(), mw.RequireRole("admin"))
	admin.GET("/stores/pending", deps.AdminHandler.GetPendingStores)
	admin.POST("/stores/:id/approve", deps.AdminHandler.ApproveStore)
	admin.POST("/stores/:id/reject", deps.AdminHandler.RejectStore)
	admin.GET("/reports", deps.AdminHandler.GetReports)
	admin.POST("/reports/:id/action", deps.AdminHandler.HandleReport)
}

// setupMediaRoutes はメディア関連のルーティングを設定します
func setupMediaRoutes(api *echo.Group, deps *common.Dependencies) {
	api.POST("/media/upload", deps.MediaHandler.UploadMedia, mw.JWTAuth())
	api.GET("/media/:id", deps.MediaHandler.GetMedia)
}
