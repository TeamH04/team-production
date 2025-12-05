package output

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// ReportRepository abstracts report persistence boundary.
type ReportRepository interface {
	FindAll(ctx context.Context) ([]domain.Report, error)
	FindByID(ctx context.Context, reportID int64) (*domain.Report, error)
	Create(ctx context.Context, report *domain.Report) error
	UpdateStatus(ctx context.Context, reportID int64, status string) error
}
