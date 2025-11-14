package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/input_port"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type AdminHandler struct {
	adminUseCase  usecase.AdminUseCase
	reportUseCase usecase.ReportUseCase
}

// NewAdminHandler は AdminHandler を生成します
func NewAdminHandler(adminUseCase usecase.AdminUseCase, reportUseCase usecase.ReportUseCase) *AdminHandler {
	return &AdminHandler{
		adminUseCase:  adminUseCase,
		reportUseCase: reportUseCase,
	}
}

// GetPendingStores は承認待ちの店舗一覧を取得します
// GET /api/admin/stores/pending
func (h *AdminHandler) GetPendingStores(c echo.Context) error {
	ctx := c.Request().Context()

	stores, err := h.adminUseCase.GetPendingStores(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, stores)
}

// ApproveStore は店舗を承認します
// POST /api/admin/stores/:id/approve
func (h *AdminHandler) ApproveStore(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	err = h.adminUseCase.ApproveStore(ctx, storeID)
	if err != nil {
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "store approved successfully"})
}

// RejectStore は店舗を差し戻します
// POST /api/admin/stores/:id/reject
func (h *AdminHandler) RejectStore(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	err = h.adminUseCase.RejectStore(ctx, storeID)
	if err != nil {
		if errors.Is(err, usecase.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "store rejected successfully"})
}

// GetReports は通報一覧を取得します
// GET /api/admin/reports
func (h *AdminHandler) GetReports(c echo.Context) error {
	ctx := c.Request().Context()

	reports, err := h.reportUseCase.GetAllReports(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, reports)
}

// HandleReport は通報に対応します
// POST /api/admin/reports/:id/action
func (h *AdminHandler) HandleReport(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	reportID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid report id"})
	}

	var req input_port.HandleReportRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	err = h.reportUseCase.HandleReport(ctx, reportID, req.Action)
	if err != nil {
		if errors.Is(err, usecase.ErrReportNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "report not found"})
		}
		if errors.Is(err, usecase.ErrInvalidAction) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid action"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "report handled successfully"})
}
