package handlers

import (
    "net/http"

    "github.com/labstack/echo/v4"
)

// JSONError writes a consistent error payload.
func JSONError(c echo.Context, status int, message string) error {
    return c.JSON(status, echo.Map{"error": message})
}

// MustBind binds JSON and returns a 400 JSON error on failure.
func MustBind[T any](c echo.Context, v *T) error {
    if err := c.Bind(v); err != nil {
        return JSONError(c, http.StatusBadRequest, "invalid JSON")
    }
    return nil
}

