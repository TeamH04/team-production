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


package handlers

import (
	"net/http"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	userUC *interactor.UserInteractor
}

func NewUserHandler(userUC *interactor.UserInteractor) *UserHandler {
	return &UserHandler{userUC: userUC}
}

// -------------------------------
// ユーザープロフィール取得
// -------------------------------
func (h *UserHandler) GetUserProfile(c echo.Context) error {
	userID := c.Get("user_id").(string) // JWTなどから取得想定

	user, err := h.userUC.GetUserProfile(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, user)
}

// -------------------------------
// ユーザープロフィール更新
// -------------------------------
func (h *UserHandler) UpdateUserProfile(c echo.Context) error {
	userID := c.Get("user_id").(string)
	var input struct {
		Name     string  `json:"name"`
		Gender   *string `json:"gender,omitempty"`
		Birthday *string `json:"birthday,omitempty"` // RFC3339形式を想定
		IconURL  string  `json:"icon_url"`
	}

	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if err := h.userUC.UpdateUserProfile(userID, input.Name, input.Gender, input.Birthday, input.IconURL); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.NoContent(http.StatusOK)
}

// -------------------------------
// お気に入り店舗一覧取得
// -------------------------------
func (h *UserHandler) GetFavoriteStores(c echo.Context) error {
	userID := c.Get("user_id").(string)

	stores, err := h.userUC.GetFavoriteStores(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, stores)
}

// -------------------------------
// お気に入り店舗登録
// -------------------------------
func (h *UserHandler) AddFavoriteStore(c echo.Context) error {
	userID := c.Get("user_id").(string)
	var req struct {
		StoreID int64 `json:"store_id"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if err := h.userUC.AddFavoriteStore(userID, req.StoreID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.NoContent(http.StatusCreated)
}

// -------------------------------
// お気に入り店舗解除
// -------------------------------
func (h *UserHandler) RemoveFavoriteStore(c echo.Context) error {
	userID := c.Get("user_id").(string)
	var req struct {
		StoreID int64 `json:"store_id"`
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if err := h.userUC.RemoveFavoriteStore(userID, req.StoreID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.NoContent(http.StatusOK)
}



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
	favoriteRepo := repository.NewFavoriteRepository(db)   //追加

	// Interactors (use cases / input ports)
	authUC := interactor.NewAuthInteractor(userRepo)
	storeQueryUC := interactor.NewStoreQueryInteractor(storeRepo)
	storeCmdUC := interactor.NewStoreCommandInteractor(storeRepo)
	reviewCmdUC := interactor.NewReviewCommandInteractor(reviewRepo, storeRepo, userRepo)
	userUC := interactor.NewUserInteractor(userRepo, favoriteRepo, storeRepo)    //追加

	// Handlers (interface adapters)
	authHandler := handlers.NewAuthHandler(authUC)
	storeHandler := handlers.NewStoreHandler(storeQueryUC, storeCmdUC)
	reviewHandler := handlers.NewReviewHandler(reviewCmdUC)
	userHandler := handlers.NewUserHandler(userUC)    //追加

	// Router and routes
	e := server.NewRouter(cfg, db)
	server.RegisterAPIRoutes(e, authHandler, storeHandler, reviewHandler)

	log.Printf("listening on :%s", cfg.Port)
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
