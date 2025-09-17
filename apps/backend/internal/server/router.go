package server

import (
	"net/http"
	"slices"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/config"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
)

func NewRouter(cfg *config.Config) *echo.Echo {
	e := echo.New()

	// 簡易CORS（必要なら echo/middleware.CORS に差し替え）
	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			origin := c.Request().Header.Get("Origin")
			allow := "*"
			if len(cfg.AllowOrigins) > 0 && cfg.AllowOrigins[0] != "*" && origin != "" {
				if slices.Contains(cfg.AllowOrigins, origin) {
					allow = origin
				} else {
					allow = ""
				}
			}
			if allow != "" {
				h := c.Response().Header()
				h.Set("Access-Control-Allow-Origin", allow)
				h.Set("Vary", "Origin")
				h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				h.Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
			}
			if c.Request().Method == http.MethodOptions {
				return c.NoContent(http.StatusNoContent)
			}
			return next(c)
		}
	})

	e.GET("/healthz", handlers.Health)

	// Google Maps の薄いプロキシ（キーがあれば有効に）
	// if cfg.GoogleMapsKey != "" {
	// 	m := handlers.NewMapsHandler(cfg)
	// 	e.GET("/api/maps/places", m.NearbySearch)
	// }

	return e
}
