package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type ReportHandler struct {
	reportUseCase usecase.ReportUseCase
}

var _ ReportController = (*ReportHandler)(nil)

type CreateReportCommand struct {
	TargetType string
	TargetID   int64
	Reason     string
}

func (c CreateReportCommand) toInput(userID string) usecase.CreateReportInput {
	return usecase.CreateReportInput{
		UserID:     userID,
		TargetType: c.TargetType,
		TargetID:   c.TargetID,
		Reason:     c.Reason,
	}
}

func NewReportHandler(reportUseCase usecase.ReportUseCase) *ReportHandler {
	return &ReportHandler{
		reportUseCase: reportUseCase,
	}
}

func (h *ReportHandler) CreateReport(ctx context.Context, userID string, cmd CreateReportCommand) (*domain.Report, error) {
	if userID == "" {
		return nil, usecase.ErrUnauthorized
	}

	return h.reportUseCase.CreateReport(ctx, cmd.toInput(userID))
}
