package handlers

import (
	"net/http"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/labstack/echo/v4"
)

type StationHandler struct {
	u input.StationUseCase
}

func NewStationHandler(u input.StationUseCase) *StationHandler {
	return &StationHandler{u: u}
}

func (h *StationHandler) ListStations(c echo.Context) error {
	stations, err := h.u.ListStations(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, stations)
}
