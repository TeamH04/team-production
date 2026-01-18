package requestcontext

import (
	"context"
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/labstack/echo/v4"
)

var (
	ErrNoUserInContext     = errors.New("no user in context")
	ErrNoUserRoleInContext = errors.New("no user role in context")
)

type (
	userKey     struct{}
	userRoleKey struct{}
)

func SetToContext(c echo.Context, user entity.User, role string) echo.Context {
	ctx := c.Request().Context()
	ctx = SetUserToContext(ctx, user, role)
	c.SetRequest(c.Request().WithContext(ctx))
	return c
}

func SetUserToContext(ctx context.Context, user entity.User, role string) context.Context {
	ctx = context.WithValue(ctx, userKey{}, user)
	return context.WithValue(ctx, userRoleKey{}, role)
}

func GetUserFromContext(ctx context.Context) (entity.User, error) {
	v := ctx.Value(userKey{})
	user, ok := v.(entity.User)
	if !ok {
		return entity.User{}, ErrNoUserInContext
	}
	return user, nil
}

func GetUserRoleFromContext(ctx context.Context) (string, error) {
	role, ok := ctx.Value(userRoleKey{}).(string)
	if !ok || role == "" {
		return "", ErrNoUserRoleInContext
	}
	return role, nil
}
