package main

import (
	"log"

	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/infra/supabase"
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
	fileRepo := repository.NewFileRepository(db)
	transaction := repository.NewGormTransaction(db)

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
	reviewUseCase := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, transaction)
	mediaUseCase := usecase.NewMediaUseCase(supabaseClient, fileRepo, storeRepo, cfg.SupabaseStorageBucket)
	userUseCase := usecase.NewUserUseCase(userRepo, reviewRepo)
	favoriteUseCase := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)
	reportUseCase := usecase.NewReportUseCase(reportRepo, userRepo)
	adminUseCase := usecase.NewAdminUseCase(storeRepo)
	authUseCase := usecase.NewAuthUseCase(supabaseClient, userRepo)

	// Application handlers (use case adapters)
	log.Println("  - Initializing handlers...")
	storeHandler := handlers.NewStoreHandler(storeUseCase)
	menuHandler := handlers.NewMenuHandler(menuUseCase)
	userHandler := handlers.NewUserHandler(userUseCase)
	favoriteHandler := handlers.NewFavoriteHandler(favoriteUseCase)
	reportHandler := handlers.NewReportHandler(reportUseCase)
	authHandler := handlers.NewAuthHandler(authUseCase, userUseCase)
	adminHandler := handlers.NewAdminHandler(adminUseCase, reportUseCase, userUseCase)
	reviewHandler := handlers.NewReviewHandler(reviewUseCase, supabaseClient)
	mediaHandler := handlers.NewMediaHandler(mediaUseCase)

	log.Println("Dependencies setup completed!")

	return &router.Dependencies{
		UserUC:          userUseCase,
		StoreHandler:    storeHandler,
		MenuHandler:     menuHandler,
		ReviewHandler:   reviewHandler,
		UserHandler:     userHandler,
		FavoriteHandler: favoriteHandler,
		ReportHandler:   reportHandler,
		AuthHandler:     authHandler,
		AdminHandler:    adminHandler,
		TokenVerifier:   supabaseClient,
		MediaHandler:    mediaHandler,
	}
}
