package router

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
)

// sanitizeLogInput removes newline characters to prevent log injection attacks (CWE-117).
func sanitizeLogInput(s string) string {
	s = strings.ReplaceAll(s, "\n", "")
	s = strings.ReplaceAll(s, "\r", "")
	return s
}

// configureErrorHandler installs a centralized HTTP error handler that maps domain/usecase errors to HTTP responses.
func configureErrorHandler(e *echo.Echo) {
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		if err == nil || c.Response().Committed {
			return
		}

		requestInfo := fmt.Sprintf("http %s %s", c.Request().Method, sanitizeLogInput(c.Request().URL.Path))

		var presErr *presentation.HTTPError
		if errors.As(err, &presErr) {
			logged := fmt.Errorf("%s: %w", requestInfo, err)
			if presErr.Status >= http.StatusInternalServerError {
				c.Logger().Error(logged)
			} else {
				c.Logger().Warn(logged)
			}
			sendHTTPError(c, presErr.Status, presErr.Body)
			return
		}

		var httpErr *echo.HTTPError
		if errors.As(err, &httpErr) {
			logged := fmt.Errorf("%s: %w", requestInfo, err)
			if httpErr.Code >= http.StatusInternalServerError {
				c.Logger().Error(logged)
			} else {
				c.Logger().Warn(logged)
			}
			sendHTTPError(c, httpErr.Code, httpErr.Message)
			return
		}

		status := presentation.StatusFromError(err)
		logged := fmt.Errorf("%s: %w", requestInfo, err)
		if status >= http.StatusInternalServerError {
			c.Logger().Error(logged)
		} else {
			c.Logger().Warn(logged)
		}
		sendHTTPError(c, status, presentation.NewErrorResponse(err.Error()))
	}
}

func sendHTTPError(c echo.Context, status int, body interface{}) {
	if err := c.JSON(status, body); err != nil {
		c.Logger().Error(err)
	}
}
