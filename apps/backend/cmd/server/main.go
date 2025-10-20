// apps/backend/cmd/server/main.go
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	e := echo.New()

	// DBをContextにセット
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("db", db)
			return next(c)
		}
	})

	api := e.Group("/api")
	api.GET("/stores", handlers.GetStores)
	api.GET("/stores/:id", handlers.GetStoreByID)
	api.POST("/stores", handlers.CreateStore)
	api.PUT("/stores/:id", handlers.UpdateStore)
	api.DELETE("/stores/:id", handlers.DeleteStore)
	// --- Menus ---
	api.POST("/stores/:id/menus", handlers.CreateMenu)
	api.GET("/stores/:id/menus", handlers.GetMenusByStoreID)

	// --- Reviews ---
	api.POST("/stores/:id/reviews", handlers.CreateReview)
	api.GET("/stores/:id/reviews", handlers.GetReviewsByStoreID)

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, echo.Map{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
