package repository

import (
	"errors"

	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// mapDBError normalizes gorm errors into domain-level errors.
func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	}
	return err
}
