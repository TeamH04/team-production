package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type ReportHandler struct {
	controller handlers.ReportController
}

func NewReportHandler(controller handlers.ReportController) *ReportHandler {
	return &ReportHandler{controller: controller}
}

type createReportDTO struct {
	TargetType string `json:"target_type"`
	TargetID   int64  `json:"target_id"`
	Reason     string `json:"reason"`
}

func (dto createReportDTO) toCommand() handlers.CreateReportCommand {
	return handlers.CreateReportCommand{
		TargetType: dto.TargetType,
		TargetID:   dto.TargetID,
		Reason:     dto.Reason,
	}
}

func (h *ReportHandler) CreateReport(c echo.Context) error {
	var dto createReportDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	userID := requestcontext.UserID(c)
	report, err := h.controller.CreateReport(c.Request().Context(), userID, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewReportResponse(*report)
	return c.JSON(http.StatusCreated, resp)
}
