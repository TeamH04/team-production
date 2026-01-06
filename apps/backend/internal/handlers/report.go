package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type ReportHandler struct {
	reportUseCase input.ReportUseCase
}

type CreateReportCommand struct {
	TargetType string
	TargetID   int64
	Reason     string
}

func (c CreateReportCommand) toInput(userID string) input.CreateReportInput {
	return input.CreateReportInput{
		UserID:     userID,
		TargetType: c.TargetType,
		TargetID:   c.TargetID,
		Reason:     c.Reason,
	}
}

func NewReportHandler(reportUseCase input.ReportUseCase) *ReportHandler {
	return &ReportHandler{
		reportUseCase: reportUseCase,
	}
}

func (h *ReportHandler) CreateReport(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	var dto createReportDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	report, err := h.reportUseCase.CreateReport(c.Request().Context(), dto.toCommand().toInput(user.UserID))
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

func (dto createReportDTO) toCommand() CreateReportCommand {
	return CreateReportCommand{
		TargetType: dto.TargetType,
		TargetID:   dto.TargetID,
		Reason:     dto.Reason,
	}
}
