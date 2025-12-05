package router

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
)

// configureErrorHandler installs a centralized HTTP error handler that maps domain/usecase errors to HTTP responses.
func configureErrorHandler(e *echo.Echo) {
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		if err == nil || c.Response().Committed {
			return
		}

		var presErr *presentation.HTTPError
		if errors.As(err, &presErr) {
			sendHTTPError(c, presErr.Status, presErr.Body)
			return
		}

		var httpErr *echo.HTTPError
		if errors.As(err, &httpErr) {
			sendHTTPError(c, httpErr.Code, httpErr.Message)
			return
		}

		status := presentation.StatusFromError(err)
		if status >= http.StatusInternalServerError {
			c.Logger().Error(err)
		}
		sendHTTPError(c, status, presentation.NewErrorResponse(err.Error()))
	}
}

func sendHTTPError(c echo.Context, status int, body interface{}) {
	if err := c.JSON(status, body); err != nil {
		c.Logger().Error(err)
	}
}
