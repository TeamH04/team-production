package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
)

// ReportRepository abstracts report persistence boundary.
type ReportRepository interface {
	FindAll(ctx context.Context) ([]entity.Report, error)
	FindByID(ctx context.Context, reportID int64) (*entity.Report, error)
	Create(ctx context.Context, report *entity.Report) error
	UpdateStatus(ctx context.Context, reportID int64, status string) error
}
