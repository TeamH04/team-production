package handlers

import (
	"context"
	"fmt"
	"strings"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AdminHandler struct {
	adminUseCase  input.AdminUseCase
	reportUseCase input.ReportUseCase
	userUseCase   input.UserUseCase
}

var _ AdminController = (*AdminHandler)(nil)

type HandleReportCommand struct {
	Action string
}

func (c HandleReportCommand) Validate() error {
	if strings.TrimSpace(c.Action) == "" {
		return fmt.Errorf("%w: action is required", usecase.ErrInvalidInput)
	}
	return nil
}

func NewAdminHandler(adminUseCase input.AdminUseCase, reportUseCase input.ReportUseCase, userUseCase input.UserUseCase) *AdminHandler {
	return &AdminHandler{
		adminUseCase:  adminUseCase,
		reportUseCase: reportUseCase,
		userUseCase:   userUseCase,
	}
}

func (h *AdminHandler) GetPendingStores(ctx context.Context) ([]domain.Store, error) {
	return h.adminUseCase.GetPendingStores(ctx)
}

func (h *AdminHandler) ApproveStore(ctx context.Context, storeID int64) error {
	return h.adminUseCase.ApproveStore(ctx, storeID)
}

func (h *AdminHandler) RejectStore(ctx context.Context, storeID int64) error {
	return h.adminUseCase.RejectStore(ctx, storeID)
}

func (h *AdminHandler) GetReports(ctx context.Context) ([]domain.Report, error) {
	return h.reportUseCase.GetAllReports(ctx)
}

func (h *AdminHandler) HandleReport(ctx context.Context, reportID int64, cmd HandleReportCommand) error {
	if err := cmd.Validate(); err != nil {
		return err
	}
	return h.reportUseCase.HandleReport(ctx, reportID, input.HandleReportAction(cmd.Action))
}

func (h *AdminHandler) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	if userID == "" {
		return nil, usecase.ErrInvalidInput
	}
	return h.userUseCase.GetUserByID(ctx, userID)
}
