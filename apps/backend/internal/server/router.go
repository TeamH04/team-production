package server

import (
	"net/http"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"
)

func NewRouter(cfg *config.Config, db *gorm.DB) *echo.Echo {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("db", db)
			return next(c)
		}
	})
	e.GET("/health", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })
	e.GET("/health/db", func(c echo.Context) error {
		sqlDB, err := db.DB()
		if err != nil {
			return c.String(http.StatusInternalServerError, "db: NG (wrap)")
		}
		if err := sqlDB.Ping(); err != nil {
			return c.String(http.StatusInternalServerError, "db: NG")
		}
		return c.String(http.StatusOK, "db: OK")
	})
	return e
}

func RegisterAPIRoutes(e *echo.Echo, auth *handlers.AuthHandler, store *handlers.StoreHandler, review *handlers.ReviewHandler) {
	api := e.Group("/api")
	// Auth
	api.POST("/auth/signup", auth.SignUp)
	api.PUT("/auth/role", auth.UpdateRole)

	// Stores
	api.GET("/stores", store.List)
	api.GET("/stores/:id", store.GetByID)
	api.POST("/stores", store.Create)
	// Reviews
	api.POST("/stores/:id/reviews", review.Post)
}
