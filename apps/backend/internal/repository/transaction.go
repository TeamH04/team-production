package repository

import (
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

func NewGormTransaction(db *gorm.DB) output.Transaction {
	return &GormTransaction{
		db: db,
	}
}

type GormTransaction struct {
	db *gorm.DB
}

func (t *GormTransaction) StartTransaction(function func(tx interface{}) error) error {
	return t.db.Transaction(func(gormTx *gorm.DB) error {
		return function(gormTx)
	})
}
