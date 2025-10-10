// apps/backend/cmd/server/main.go
package main

import (
	"log"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/server"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := config.OpenDB(cfg.DBURL)
	if err != nil {
		log.Fatalf("db open failed: %v", err)
	}

	// Repositories (output ports)
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	reviewRepo := repository.NewReviewRepository(db)

	// Interactors (use cases / input ports)
	authUC := interactor.NewAuthInteractor(userRepo)
	storeQueryUC := interactor.NewStoreQueryInteractor(storeRepo)
	storeCmdUC := interactor.NewStoreCommandInteractor(storeRepo)
	reviewCmdUC := interactor.NewReviewCommandInteractor(reviewRepo, storeRepo, userRepo)

	// Handlers (interface adapters)
	authHandler := handlers.NewAuthHandler(authUC)
	storeHandler := handlers.NewStoreHandler(storeQueryUC, storeCmdUC)
	reviewHandler := handlers.NewReviewHandler(reviewCmdUC)

	// Router and routes
	e := server.NewRouter(cfg, db)
	server.RegisterAPIRoutes(e, authHandler, storeHandler, reviewHandler)

	log.Printf("listening on :%s", cfg.Port)
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
