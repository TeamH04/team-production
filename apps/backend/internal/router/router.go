package router

import (
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
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
	StationHandler  *handlers.StationHandler
	ReviewHandler   *handlers.ReviewHandler
	UserHandler     *handlers.UserHandler
	FavoriteHandler *handlers.FavoriteHandler
	ReportHandler   *handlers.ReportHandler
	AuthHandler     *handlers.AuthHandler
	AdminHandler    *handlers.AdminHandler
	MediaHandler    *handlers.MediaHandler

	TokenVerifier  security.TokenVerifier
	AuthMiddleware *mw.AuthMiddleware
}

// NewServer は全てのルーティングとミドルウェアを設定したサーバーを返します
func NewServer(deps *Dependencies) *echo.Echo {
	e := echo.New()

	configureErrorHandler(e)

	// Create auth middleware instance if not provided
	if deps.AuthMiddleware == nil {
		deps.AuthMiddleware = mw.NewAuthMiddleware(deps.UserUC)
	}

	// グローバルミドルウェア
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogStatus:   true,
		LogURI:      true,
		LogMethod:   true,
		LogError:    true,
		LogLatency:  true,
		HandleError: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			// 400以上のステータスコード（エラー）のみログ出力
			if v.Status >= 400 {
				attrs := []any{
					"method", v.Method,
					"uri", v.URI,
					"status", v.Status,
					"latency", v.Latency,
				}
				if v.Error != nil {
					attrs = append(attrs, "error", v.Error)
				}
				if v.Status >= 500 {
					slog.Error("REQUEST", attrs...)
				} else {
					slog.Warn("REQUEST", attrs...)
				}
			}
			return nil
		},
	}))
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// ヘルスチェック
	e.GET(HealthPath, func(c echo.Context) error {
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

	// 駅関連エンドポイント
	setupStationRoutes(api, deps)

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
	auth.POST(AuthSignupPath, deps.AuthHandler.Signup)
	auth.POST(AuthLoginPath, deps.AuthHandler.Login)
	auth.GET(AuthMePath, deps.AuthHandler.GetMe, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
	auth.PUT(AuthRolePath, deps.AuthHandler.UpdateRole, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
}

// setupStoreRoutes は店舗関連のルーティングを設定します
func setupStoreRoutes(api *echo.Group, deps *Dependencies) {
	// 店舗エンドポイント（一部公開、一部認証必要）
	api.GET(StoresPath, deps.StoreHandler.GetStores)
	api.GET(StoreByIDPath, deps.StoreHandler.GetStoreByID)
	api.POST(StoresPath, deps.StoreHandler.CreateStore, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier), deps.AuthMiddleware.RequireRole(role.OwnerOrAdmin...))
	api.PUT(StoreByIDPath, deps.StoreHandler.UpdateStore, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier), deps.AuthMiddleware.RequireRole(role.OwnerOrAdmin...))
	api.DELETE(StoreByIDPath, deps.StoreHandler.DeleteStore, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier), deps.AuthMiddleware.RequireRole(role.Admin))

	// メニューエンドポイント
	api.GET(StoreMenusPath, deps.MenuHandler.GetMenusByStoreID)
	api.POST(StoreMenusPath, deps.MenuHandler.CreateMenu, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier), deps.AuthMiddleware.RequireRole(role.OwnerOrAdmin...))
	// レビューエンドポイント
	api.GET(StoreReviewsPath, deps.ReviewHandler.GetReviewsByStoreID)
	api.POST(StoreReviewsPath, deps.ReviewHandler.Create, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))

	// レビューいいねエンドポイント
	api.POST(ReviewLikesPath, deps.ReviewHandler.LikeReview, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
	api.DELETE(ReviewLikesPath, deps.ReviewHandler.UnlikeReview, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
}

// setupStationRoutes は駅関連のルーティングを設定します
func setupStationRoutes(api *echo.Group, deps *Dependencies) {
	api.GET(StationsPath, deps.StationHandler.ListStations)
}

// setupUserRoutes はユーザー関連のルーティングを設定します
func setupUserRoutes(api *echo.Group, deps *Dependencies) {
	api.GET(UsersMePath, deps.UserHandler.GetMe, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
	api.PUT(UserByIDPath, deps.UserHandler.UpdateUser, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
	api.GET(UserReviewsPath, deps.UserHandler.GetUserReviews)
}

// setupFavoriteRoutes はお気に入り関連のルーティングを設定します
func setupFavoriteRoutes(api *echo.Group, deps *Dependencies) {
	api.GET(
		UserFavoritesPath,
		deps.FavoriteHandler.GetMyFavorites,
		deps.AuthMiddleware.JWTAuth(deps.TokenVerifier),
	)
	api.POST(UserFavoritesPath, deps.FavoriteHandler.AddFavorite, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
	api.DELETE(UserFavoriteByPath, deps.FavoriteHandler.RemoveFavorite, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
}

// setupReportRoutes は通報関連のルーティングを設定します
func setupReportRoutes(api *echo.Group, deps *Dependencies) {
	api.POST(ReportsPath, deps.ReportHandler.CreateReport, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
}

// setupMediaRoutes はメディア関連のルーティングを設定します
func setupMediaRoutes(api *echo.Group, deps *Dependencies) {
	api.POST(MediaUploadPath, deps.MediaHandler.CreateReviewUploads, deps.AuthMiddleware.JWTAuth(deps.TokenVerifier))
}

// setupAdminRoutes は管理者用のルーティングを設定します
func setupAdminRoutes(api *echo.Group, deps *Dependencies) {
	admin := api.Group("/admin", deps.AuthMiddleware.JWTAuth(deps.TokenVerifier), deps.AuthMiddleware.RequireRole(role.Admin))
	admin.GET(AdminStoresPendingPath, deps.AdminHandler.GetPendingStores)
	admin.POST(AdminStoreApprovePath, deps.AdminHandler.ApproveStore)
	admin.POST(AdminStoreRejectPath, deps.AdminHandler.RejectStore)
	admin.GET(AdminReportsPath, deps.AdminHandler.GetReports)
	admin.POST(AdminReportActionPath, deps.AdminHandler.HandleReport)
	admin.GET(AdminUserByIDPath, deps.AdminHandler.GetUserByID)
}
