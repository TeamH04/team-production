package httpadapter

import (
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
)

func parseInt64Param(c echo.Context, name, errMsg string) (int64, error) {
	val := c.Param(name)
	id, err := strconv.ParseInt(val, 10, 64)
	if err != nil {
		return 0, presentation.NewBadRequest(errMsg)
	}
	return id, nil
}
