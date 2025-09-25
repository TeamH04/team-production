package server

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
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

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

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

	// Google Maps の薄いプロキシ（キーがあれば有効に）
	// if cfg.GoogleMapsKey != "" {
	// 	m := handlers.NewMapsHandler(cfg)
	// 	e.GET("/api/maps/places", m.NearbySearch)
	// }

	return e
}
