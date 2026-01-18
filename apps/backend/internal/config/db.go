package config

import (
	"github.com/TeamH04/team-production/apps/backend/internal/domain/constants"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func OpenDB(dsn string) (*gorm.DB, error) {
	cfg := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	}
	db, err := gorm.Open(postgres.Open(dsn), cfg)
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(constants.DBMaxOpenConns)
	sqlDB.SetMaxIdleConns(constants.DBMaxIdleConns)
	sqlDB.SetConnMaxLifetime(DBConnMaxLifetime)

	return db, nil
}
