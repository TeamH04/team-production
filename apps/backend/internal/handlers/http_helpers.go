package handlers

import (
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// Error message constants
const (
	ErrMsgInvalidJSON     = "invalid JSON"
	ErrMsgInvalidStoreID  = "invalid store id"
	ErrMsgInvalidReviewID = "invalid review id"
)

// getRequiredUser extracts the authenticated user from the request context.
// Returns ErrUnauthorized if the user is not authenticated.
func getRequiredUser(c echo.Context) (entity.User, error) {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return entity.User{}, usecase.ErrUnauthorized
	}
	return user, nil
}

// bindJSON binds JSON request body to the given struct and returns BadRequest on error.
func bindJSON[T any](c echo.Context, dst *T) error {
	if err := c.Bind(dst); err != nil {
		return presentation.NewBadRequest(ErrMsgInvalidJSON)
	}
	return nil
}

func parseInt64Param(c echo.Context, name, errMsg string) (int64, error) {
	value := c.Param(name)
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, presentation.NewBadRequest(errMsg)
	}
	return id, nil
}

func parseUUIDParam(c echo.Context, name, errMsg string) (string, error) {
	value := c.Param(name)
	if _, err := uuid.Parse(value); err != nil {
		return "", presentation.NewBadRequest(errMsg)
	}
	return value, nil
}

func bearerTokenFromHeader(value string) string {
	if value == "" {
		return ""
	}
	const prefix = "Bearer "
	if strings.HasPrefix(value, prefix) {
		return strings.TrimSpace(strings.TrimPrefix(value, prefix))
	}
	return strings.TrimSpace(value)
}
