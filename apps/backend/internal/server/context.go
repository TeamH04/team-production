package server

import (
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

const ctxKeyDB = "db"

func GetDB(c echo.Context) *gorm.DB {
	if v := c.Get(ctxKeyDB); v != nil {
		if db, ok := v.(*gorm.DB); ok {
			return db
		}
	}
	return nil
}
