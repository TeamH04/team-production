package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
)

type AdminHandler struct {
	controller handlers.AdminController
}

func NewAdminHandler(controller handlers.AdminController) *AdminHandler {
	return &AdminHandler{controller: controller}
}

func (h *AdminHandler) GetPendingStores(c echo.Context) error {
	stores, err := h.controller.GetPendingStores(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewStoreResponses(stores))
}

func (h *AdminHandler) ApproveStore(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	if err := h.controller.ApproveStore(c.Request().Context(), storeID); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("store approved successfully"))
}

func (h *AdminHandler) RejectStore(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	if err := h.controller.RejectStore(c.Request().Context(), storeID); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("store rejected successfully"))
}

func (h *AdminHandler) GetReports(c echo.Context) error {
	reports, err := h.controller.GetReports(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReportResponses(reports))
}

type handleReportDTO struct {
	Action string `json:"action"`
}

func (dto handleReportDTO) toCommand() handlers.HandleReportCommand {
	return handlers.HandleReportCommand{Action: dto.Action}
}

func (h *AdminHandler) HandleReport(c echo.Context) error {
	reportID, err := parseInt64Param(c, "id", "invalid report id")
	if err != nil {
		return err
	}
	var dto handleReportDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	if err := h.controller.HandleReport(c.Request().Context(), reportID, dto.toCommand()); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("report handled successfully"))
}

func (h *AdminHandler) GetUserByID(c echo.Context) error {
	userID := c.Param("id")
	user, err := h.controller.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusOK, resp)
}
