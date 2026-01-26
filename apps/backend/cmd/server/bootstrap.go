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
	stationRepo := repository.NewStationRepository(db)
	transaction := repository.NewGormTransaction(db)

	// External services
	supabaseClient := supabase.NewClient(
		cfg.SupabaseURL,
		cfg.SupabasePublishableKey,
		cfg.SupabaseSecretKey,
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
	stationUseCase := usecase.NewStationUseCase(stationRepo)
	adminUseCase := usecase.NewAdminUseCase(storeRepo)
	authUseCase := usecase.NewAuthUseCase(supabaseClient, userRepo)
	ownerUseCase := usecase.NewOwnerUseCase(
		userRepo,
		transaction,
		supabaseClient,
	)

	// Application handlers (use case adapters)
	log.Println("  - Initializing handlers...")
	storeHandler := handlers.NewStoreHandler(storeUseCase, supabaseClient, cfg.SupabaseStorageBucket)
	menuHandler := handlers.NewMenuHandler(menuUseCase)
	userHandler := handlers.NewUserHandler(userUseCase, supabaseClient, cfg.SupabaseStorageBucket)
	favoriteHandler := handlers.NewFavoriteHandler(favoriteUseCase)
	reportHandler := handlers.NewReportHandler(reportUseCase)
	stationHandler := handlers.NewStationHandler(stationUseCase)
	authHandler := handlers.NewAuthHandler(authUseCase, userUseCase)
	ownerHandler := handlers.NewOwnerHandler(ownerUseCase)
	adminHandler := handlers.NewAdminHandler(adminUseCase, reportUseCase, userUseCase)
	// supabaseClient は TokenVerifier（JWT検証）と StorageProvider（署名付きURL生成）の両方を実装しているため、
	// 同一インスタンスをそれぞれの依存として注入する。
	reviewHandler := handlers.NewReviewHandler(reviewUseCase, supabaseClient, supabaseClient, cfg.SupabaseStorageBucket)
	mediaHandler := handlers.NewMediaHandler(mediaUseCase)

	log.Println("Dependencies setup completed!")

	return &router.Dependencies{
		UserUC:          userUseCase,
		StoreHandler:    storeHandler,
		MenuHandler:     menuHandler,
		StationHandler:  stationHandler,
		ReviewHandler:   reviewHandler,
		UserHandler:     userHandler,
		FavoriteHandler: favoriteHandler,
		ReportHandler:   reportHandler,
		AuthHandler:     authHandler,
		OwnerHandler:    ownerHandler,
		AdminHandler:    adminHandler,
		TokenVerifier:   supabaseClient,
		MediaHandler:    mediaHandler,
	}
}
