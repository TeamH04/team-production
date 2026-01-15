package router

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	mw "github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// Dependencies bundles the HTTP handlers and middleware collaborators required by the router.
type Dependencies struct {
	UserUC          input.UserUseCase
	StoreHandler    *handlers.StoreHandler
	MenuHandler     *handlers.MenuHandler
	ReviewHandler   *handlers.ReviewHandler
	UserHandler     *handlers.UserHandler
	FavoriteHandler *handlers.FavoriteHandler
	ReportHandler   *handlers.ReportHandler
	AuthHandler     *handlers.AuthHandler
	AdminHandler    *handlers.AdminHandler
	MediaHandler    *handlers.MediaHandler

	TokenVerifier security.TokenVerifier
}

// NewServer は全てのルーティングとミドルウェアを設定したサーバーを返します
func NewServer(deps *Dependencies) *echo.Echo {
	e := echo.New()

	configureErrorHandler(e)

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
func setupAPIRoutes(e *echo.Echo, deps *Dependencies) {
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

	// メディア関連エンドポイント
	setupMediaRoutes(api, deps)

	// 管理者用エンドポイント
	setupAdminRoutes(api, deps)
}

// setupAuthRoutes は認証関連のルーティングを設定します
func setupAuthRoutes(api *echo.Group, deps *Dependencies) {
	auth := api.Group("/auth")
	auth.POST("/signup", deps.AuthHandler.Signup)
	auth.POST("/login", deps.AuthHandler.Login)
	auth.GET("/me", deps.AuthHandler.GetMe, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
	auth.PUT("/role", deps.AuthHandler.UpdateRole, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
}

// setupStoreRoutes は店舗関連のルーティングを設定します
func setupStoreRoutes(api *echo.Group, deps *Dependencies) {
	// 店舗エンドポイント（一部公開、一部認証必要）
	api.GET("/stores", deps.StoreHandler.GetStores)
	api.GET("/stores/:id", deps.StoreHandler.GetStoreByID)
	api.POST("/stores", deps.StoreHandler.CreateStore, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier), mw.NewAuthMiddleware(deps.UserUC).RequireRole("owner", "admin"))
	api.PUT("/stores/:id", deps.StoreHandler.UpdateStore, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier), mw.NewAuthMiddleware(deps.UserUC).RequireRole("owner", "admin"))
	api.DELETE("/stores/:id", deps.StoreHandler.DeleteStore, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier), mw.NewAuthMiddleware(deps.UserUC).RequireRole("admin"))

	// メニューエンドポイント
	api.GET("/stores/:id/menus", deps.MenuHandler.GetMenusByStoreID)
	api.POST("/stores/:id/menus", deps.MenuHandler.CreateMenu, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier), mw.NewAuthMiddleware(deps.UserUC).RequireRole("owner", "admin"))
	// レビューエンドポイント
	api.GET("/stores/:id/reviews", deps.ReviewHandler.GetReviewsByStoreID)
	api.POST("/stores/:id/reviews", deps.ReviewHandler.Create, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))

	// レビューいいねエンドポイント
	api.POST("/reviews/:id/likes", deps.ReviewHandler.LikeReview, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
	api.DELETE("/reviews/:id/likes", deps.ReviewHandler.UnlikeReview, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
}

// setupUserRoutes はユーザー関連のルーティングを設定します
func setupUserRoutes(api *echo.Group, deps *Dependencies) {
	api.GET("/users/me", deps.UserHandler.GetMe, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
	api.PUT("/users/:id", deps.UserHandler.UpdateUser, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
	api.GET("/users/:id/reviews", deps.UserHandler.GetUserReviews)
}

// setupFavoriteRoutes はお気に入り関連のルーティングを設定します
func setupFavoriteRoutes(api *echo.Group, deps *Dependencies) {
	api.GET(
		"/users/me/favorites",
		deps.FavoriteHandler.GetMyFavorites,
		mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier),
	)
	api.POST("/users/me/favorites", deps.FavoriteHandler.AddFavorite, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
	api.DELETE("/users/me/favorites/:store_id", deps.FavoriteHandler.RemoveFavorite, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
}

// setupReportRoutes は通報関連のルーティングを設定します
func setupReportRoutes(api *echo.Group, deps *Dependencies) {
	api.POST("/reports", deps.ReportHandler.CreateReport, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
}

// setupMediaRoutes はメディア関連のルーティングを設定します
func setupMediaRoutes(api *echo.Group, deps *Dependencies) {
	api.POST("/media/upload", deps.MediaHandler.CreateReviewUploads, mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier))
}

// setupAdminRoutes は管理者用のルーティングを設定します
func setupAdminRoutes(api *echo.Group, deps *Dependencies) {
	admin := api.Group("/admin", mw.NewAuthMiddleware(deps.UserUC).JWTAuth(deps.TokenVerifier), mw.NewAuthMiddleware(deps.UserUC).RequireRole("admin"))
	admin.GET("/stores/pending", deps.AdminHandler.GetPendingStores)
	admin.POST("/stores/:id/approve", deps.AdminHandler.ApproveStore)
	admin.POST("/stores/:id/reject", deps.AdminHandler.RejectStore)
	admin.GET("/reports", deps.AdminHandler.GetReports)
	admin.POST("/reports/:id/action", deps.AdminHandler.HandleReport)
	admin.GET("/users/:id", deps.AdminHandler.GetUserByID)
}
