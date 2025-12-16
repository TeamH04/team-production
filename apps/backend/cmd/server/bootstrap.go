package main

import (
	"log"

	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/infra/supabase"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/httpadapter"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/router"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// buildRouterDependencies wires the production dependencies for the HTTP server.
func buildRouterDependencies(cfg *config.Config, db *gorm.DB) *router.Dependencies {
	log.Println("Setting up dependencies...")

	// Repository layer
	log.Println("  - Initializing repositories...")
	storeRepo := repository.NewStoreRepository(db)
	menuRepo := repository.NewMenuRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	userRepo := repository.NewUserRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)
	reportRepo := repository.NewReportRepository(db)
	mediaRepo := repository.NewMediaRepository(db)

	// External services
	supabaseClient := supabase.NewClient(
		cfg.SupabaseURL,
		cfg.SupabaseAnonKey,
		cfg.SupabaseServiceRoleKey,
		cfg.SupabaseJWTSecret,
	)

	// Use cases
	log.Println("  - Initializing use cases...")
	storeUseCase := usecase.NewStoreUseCase(storeRepo)
	menuUseCase := usecase.NewMenuUseCase(menuRepo, storeRepo)
	reviewUseCase := usecase.NewReviewUseCase(reviewRepo, storeRepo)
	userUseCase := usecase.NewUserUseCase(userRepo, reviewRepo)
	favoriteUseCase := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)
	reportUseCase := usecase.NewReportUseCase(reportRepo, userRepo)
	adminUseCase := usecase.NewAdminUseCase(storeRepo)
	mediaUseCase := usecase.NewMediaUseCase(mediaRepo, supabaseClient, cfg.SupabaseStorageBucket)
	authUseCase := usecase.NewAuthUseCase(supabaseClient, userRepo)

	// Application handlers (use case adapters)
	log.Println("  - Initializing handlers...")
	storeController := handlers.NewStoreHandler(storeUseCase)
	menuController := handlers.NewMenuHandler(menuUseCase)
	reviewController := handlers.NewReviewHandler(reviewUseCase)
	userController := handlers.NewUserHandler(userUseCase)
	favoriteController := handlers.NewFavoriteHandler(favoriteUseCase)
	reportController := handlers.NewReportHandler(reportUseCase)
	authController := handlers.NewAuthHandler(authUseCase, userUseCase)
	adminController := handlers.NewAdminHandler(adminUseCase, reportUseCase, userUseCase)
	mediaController := handlers.NewMediaHandler(mediaUseCase)

	// HTTP adapters
	storeHTTP := httpadapter.NewStoreHandler(storeController)
	menuHTTP := httpadapter.NewMenuHandler(menuController)
	reviewHTTP := httpadapter.NewReviewHandler(reviewController)
	userHTTP := httpadapter.NewUserHandler(userController)
	favoriteHTTP := httpadapter.NewFavoriteHandler(favoriteController)
	reportHTTP := httpadapter.NewReportHandler(reportController)
	authHTTP := httpadapter.NewAuthHandler(authController)
	adminHTTP := httpadapter.NewAdminHandler(adminController)
	mediaHTTP := httpadapter.NewMediaHandler(mediaController)

	log.Println("Dependencies setup completed!")

	return &router.Dependencies{
		StoreHandler:    storeHTTP,
		MenuHandler:     menuHTTP,
		ReviewHandler:   reviewHTTP,
		UserHandler:     userHTTP,
		FavoriteHandler: favoriteHTTP,
		ReportHandler:   reportHTTP,
		AuthHandler:     authHTTP,
		AdminHandler:    adminHTTP,
		MediaHandler:    mediaHTTP,
		TokenVerifier:   supabaseClient,
	}
}
