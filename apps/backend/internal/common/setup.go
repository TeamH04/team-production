package common

import (
	"log"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// Dependencies は各層の依存関係を保持する構造体
type Dependencies struct {
	// Repositories
	StoreRepo    repository.StoreRepository
	MenuRepo     repository.MenuRepository
	ReviewRepo   repository.ReviewRepository
	UserRepo     repository.UserRepository
	FavoriteRepo repository.FavoriteRepository
	ReportRepo   repository.ReportRepository
	MediaRepo    repository.MediaRepository

	// UseCases
	StoreUseCase    usecase.StoreUseCase
	MenuUseCase     usecase.MenuUseCase
	ReviewUseCase   usecase.ReviewUseCase
	UserUseCase     usecase.UserUseCase
	FavoriteUseCase usecase.FavoriteUseCase
	ReportUseCase   usecase.ReportUseCase
	AdminUseCase    usecase.AdminUseCase
	MediaUseCase    usecase.MediaUseCase

	// Handlers
	StoreHandler    *handlers.StoreHandler
	MenuHandler     *handlers.MenuHandler
	ReviewHandler   *handlers.ReviewHandler
	UserHandler     *handlers.UserHandler
	FavoriteHandler *handlers.FavoriteHandler
	ReportHandler   *handlers.ReportHandler
	AuthHandler     *handlers.AuthHandler
	AdminHandler    *handlers.AdminHandler
	MediaHandler    *handlers.MediaHandler
}

// SetupDependencies は全ての依存関係を構築して返します
func SetupDependencies(db *gorm.DB) *Dependencies {
	log.Println("Setting up dependencies...")

	// Repository層の初期化
	log.Println("  - Initializing repositories...")
	storeRepo := repository.NewStoreRepository(db)
	menuRepo := repository.NewMenuRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	userRepo := repository.NewUserRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)
	reportRepo := repository.NewReportRepository(db)
	mediaRepo := repository.NewMediaRepository(db)

	// UseCase層の初期化
	log.Println("  - Initializing use cases...")
	storeUseCase := usecase.NewStoreUseCase(storeRepo)
	menuUseCase := usecase.NewMenuUseCase(menuRepo, storeRepo)
	reviewUseCase := usecase.NewReviewUseCase(reviewRepo, storeRepo)
	userUseCase := usecase.NewUserUseCase(userRepo, reviewRepo)
	favoriteUseCase := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)
	reportUseCase := usecase.NewReportUseCase(reportRepo, userRepo)
	adminUseCase := usecase.NewAdminUseCase(storeRepo)
	mediaUseCase := usecase.NewMediaUseCase(mediaRepo)

	// Handler層の初期化
	log.Println("  - Initializing handlers...")
	storeHandler := handlers.NewStoreHandler(storeUseCase)
	menuHandler := handlers.NewMenuHandler(menuUseCase)
	reviewHandler := handlers.NewReviewHandler(reviewUseCase)
	userHandler := handlers.NewUserHandler(userUseCase)
	favoriteHandler := handlers.NewFavoriteHandler(favoriteUseCase)
	reportHandler := handlers.NewReportHandler(reportUseCase)
	authHandler := handlers.NewAuthHandler(userRepo)
	adminHandler := handlers.NewAdminHandler(adminUseCase, reportUseCase)
	mediaHandler := handlers.NewMediaHandler(mediaUseCase)

	log.Println("Dependencies setup completed!")

	return &Dependencies{
		// Repositories
		StoreRepo:    storeRepo,
		MenuRepo:     menuRepo,
		ReviewRepo:   reviewRepo,
		UserRepo:     userRepo,
		FavoriteRepo: favoriteRepo,
		ReportRepo:   reportRepo,
		MediaRepo:    mediaRepo,

		// UseCases
		StoreUseCase:    storeUseCase,
		MenuUseCase:     menuUseCase,
		ReviewUseCase:   reviewUseCase,
		UserUseCase:     userUseCase,
		FavoriteUseCase: favoriteUseCase,
		ReportUseCase:   reportUseCase,
		AdminUseCase:    adminUseCase,
		MediaUseCase:    mediaUseCase,

		// Handlers
		StoreHandler:    storeHandler,
		MenuHandler:     menuHandler,
		ReviewHandler:   reviewHandler,
		UserHandler:     userHandler,
		FavoriteHandler: favoriteHandler,
		ReportHandler:   reportHandler,
		AuthHandler:     authHandler,
		AdminHandler:    adminHandler,
		MediaHandler:    mediaHandler,
	}
}

// SetupRouter は全てのルーティングを設定したEchoインスタンスを返します
func SetupRouter(deps *Dependencies) *echo.Echo {
	log.Println("Setting up router...")

	e := echo.New()

	// ミドルウェアの設定は router パッケージに委譲
	// ここでは基本的なEchoインスタンスのみを返す

	log.Println("Router setup completed!")
	return e
}
