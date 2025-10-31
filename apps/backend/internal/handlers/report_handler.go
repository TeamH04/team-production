package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type ReportHandler struct {
	reportUseCase usecase.ReportUseCase
}

// NewReportHandler は ReportHandler を生成します
func NewReportHandler(reportUseCase usecase.ReportUseCase) *ReportHandler {
	return &ReportHandler{
		reportUseCase: reportUseCase,
	}
}

// CreateReport は通報を作成します
// POST /api/reports
func (h *ReportHandler) CreateReport(c echo.Context) error {
	ctx := c.Request().Context()
	userID := middleware.GetUserID(c)

	var req usecase.CreateReportInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	req.UserID = userID

	report, err := h.reportUseCase.CreateReport(ctx, req)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidInput) || errors.Is(err, usecase.ErrInvalidTargetType) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, report)
}
