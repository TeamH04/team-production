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
		// Log the actual error for debugging
		c.Logger().Error("Failed to list stations: ", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "駅情報の取得に失敗しました"})
	}
	return c.JSON(http.StatusOK, stations)
}
