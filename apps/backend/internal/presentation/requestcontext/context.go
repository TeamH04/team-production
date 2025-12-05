package requestcontext

import "github.com/labstack/echo/v4"

const (
	userIDKey   = "user_id"
	userRoleKey = "user_role"
)

// SetUser stores authenticated user information into the Echo context.
func SetUser(c echo.Context, userID, role string) {
	c.Set(userIDKey, userID)
	c.Set(userRoleKey, role)
}

// UserID fetches the authenticated user ID from the context.
func UserID(c echo.Context) string {
	userID, _ := c.Get(userIDKey).(string)
	return userID
}

// UserRole fetches the authenticated user role from the context.
func UserRole(c echo.Context) string {
	role, _ := c.Get(userRoleKey).(string)
	return role
}
