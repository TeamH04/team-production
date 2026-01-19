package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AdminHandler struct {
	adminUseCase  input.AdminUseCase
	reportUseCase input.ReportUseCase
	userUseCase   input.UserUseCase
}

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

func (h *AdminHandler) GetPendingStores(c echo.Context) error {
	stores, err := h.adminUseCase.GetPendingStores(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewStoreResponses(stores))
}

func (h *AdminHandler) ApproveStore(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", ErrMsgInvalidStoreID)
	if err != nil {
		return err
	}
	if err := h.adminUseCase.ApproveStore(c.Request().Context(), storeID); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("store approved successfully"))
}

func (h *AdminHandler) RejectStore(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", ErrMsgInvalidStoreID)
	if err != nil {
		return err
	}
	if err := h.adminUseCase.RejectStore(c.Request().Context(), storeID); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("store rejected successfully"))
}

func (h *AdminHandler) GetReports(c echo.Context) error {
	reports, err := h.reportUseCase.GetAllReports(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReportResponses(reports))
}

func (h *AdminHandler) HandleReport(c echo.Context) error {
	reportID, err := parseInt64Param(c, "id", "invalid report id")
	if err != nil {
		return err
	}
	var dto handleReportDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}
	cmd := dto.toCommand()
	if err := cmd.Validate(); err != nil {
		return err
	}
	if err := h.reportUseCase.HandleReport(c.Request().Context(), reportID, input.HandleReportAction(cmd.Action)); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("report handled successfully"))
}

func (h *AdminHandler) GetUserByID(c echo.Context) error {
	return fetchAndRespondWithCurrentUser(c, h.userUseCase)
}

type handleReportDTO struct {
	Action string `json:"action"`
}

func (dto handleReportDTO) toCommand() HandleReportCommand {
	return HandleReportCommand(dto)
}
