package handlers

import (
    "database/sql"
    "net/http"

    "github.com/labstack/echo/v4"
    "gorm.io/gorm"
)

// Health is a simple liveness probe.
func Health(c echo.Context) error {
    return c.String(http.StatusOK, "ok")
}

// HealthDB returns a handler that checks database connectivity.
func HealthDB(db *gorm.DB) echo.HandlerFunc {
    return func(c echo.Context) error {
        sqlDB, err := db.DB()
        if err != nil {
            return c.JSON(http.StatusInternalServerError, echo.Map{"status": "db: NG", "error": err.Error()})
        }
        if err := ping(sqlDB); err != nil {
            return c.JSON(http.StatusInternalServerError, echo.Map{"status": "db: NG", "error": err.Error()})
        }
        return c.JSON(http.StatusOK, echo.Map{"status": "db: OK"})
    }
}

func ping(db *sql.DB) error { return db.Ping() }
