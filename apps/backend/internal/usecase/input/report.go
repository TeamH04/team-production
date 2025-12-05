package input

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

type HandleReportAction string

const (
	HandleReportResolve HandleReportAction = "resolve"
	HandleReportReject  HandleReportAction = "reject"
)

type CreateReportInput struct {
	UserID     string
	TargetType string
	TargetID   int64
	Reason     string
}

// ReportUseCase defines inbound port for report operations.
type ReportUseCase interface {
	CreateReport(ctx context.Context, input CreateReportInput) (*domain.Report, error)
	GetAllReports(ctx context.Context) ([]domain.Report, error)
	HandleReport(ctx context.Context, reportID int64, action HandleReportAction) error
}
