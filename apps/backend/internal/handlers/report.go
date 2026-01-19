package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type ReportHandler struct {
	reportUseCase input.ReportUseCase
}

func NewReportHandler(reportUseCase input.ReportUseCase) *ReportHandler {
	return &ReportHandler{
		reportUseCase: reportUseCase,
	}
}

func (h *ReportHandler) CreateReport(c echo.Context) error {
	user, err := getRequiredUser(c)
	if err != nil {
		return err
	}

	var dto createReportDTO
	if err = bindJSON(c, &dto); err != nil {
		return err
	}

	report, err := h.reportUseCase.CreateReport(c.Request().Context(), dto.toInput(user.UserID))
	if err != nil {
		return err
	}
	resp := presenter.NewReportResponse(*report)
	return c.JSON(http.StatusCreated, resp)
}

type createReportDTO struct {
	TargetType string `json:"target_type"`
	TargetID   int64  `json:"target_id"`
	Reason     string `json:"reason"`
}

func (dto createReportDTO) toInput(userID string) input.CreateReportInput {
	return input.CreateReportInput{
		UserID:     userID,
		TargetType: dto.TargetType,
		TargetID:   dto.TargetID,
		Reason:     dto.Reason,
	}
}
