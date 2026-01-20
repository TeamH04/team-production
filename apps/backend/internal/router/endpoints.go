package router

// エンドポイントパス定数
const (
	// Health
	HealthPath = "/health"

	// Auth
	AuthSignupPath          = "/signup"
	AuthLoginPath           = "/login"
	AuthMePath              = "/me"
	AuthRolePath            = "/role"
	OwnerSignupCompletePath = "/owner/signup/complete"

	// Stores
	StoresPath       = "/stores"
	StoreByIDPath    = "/stores/:id"
	StoreMenusPath   = "/stores/:id/menus"
	StoreReviewsPath = "/stores/:id/reviews"

	// Reviews
	ReviewLikesPath = "/reviews/:id/likes"

	// Users
	UsersMePath        = "/users/me"
	UserByIDPath       = "/users/:id"
	UserReviewsPath    = "/users/:id/reviews"
	UserFavoritesPath  = "/users/me/favorites"
	UserFavoriteByPath = "/users/me/favorites/:store_id"

	// Reports
	ReportsPath = "/reports"

	// Media
	MediaUploadPath = "/media/upload"

	// Admin
	AdminStoresPendingPath = "/stores/pending"
	AdminStoreApprovePath  = "/stores/:id/approve"
	AdminStoreRejectPath   = "/stores/:id/reject"
	AdminReportsPath       = "/reports"
	AdminReportActionPath  = "/reports/:id/action"
	AdminUserByIDPath      = "/users/:id"
)
