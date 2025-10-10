package handlers

import (
	"net/http"
	"strconv"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
	"github.com/labstack/echo/v4"
)

type StoreHandler struct {
	q port.StoreQueryUsecase
	c port.StoreCommandUsecase
}

func NewStoreHandler(q port.StoreQueryUsecase, c port.StoreCommandUsecase) *StoreHandler {
	return &StoreHandler{q: q, c: c}
}

func (h *StoreHandler) List(c echo.Context) error {
	out, err := h.q.ListStores()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, out)
}

func (h *StoreHandler) GetByID(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}
	s, err := h.q.GetStoreByID(id)
	if err == interactor.ErrNotFound {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "not found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, s)
}

func (h *StoreHandler) Create(c echo.Context) error {
	var in domain.Store
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}
	s, err := h.c.CreateStore(in)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, s)
}
