package httpadapter

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
)

type StoreHandler struct {
	controller handlers.StoreController
}

func NewStoreHandler(controller handlers.StoreController) *StoreHandler {
	return &StoreHandler{controller: controller}
}

func (h *StoreHandler) GetStores(c echo.Context) error {
	stores, err := h.controller.GetStores(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewStoreResponses(stores))
}

func (h *StoreHandler) GetStoreByID(c echo.Context) error {
	id, err := parseInt64Param(c, "id", "invalid id")
	if err != nil {
		return err
	}
	store, err := h.controller.GetStoreByID(c.Request().Context(), id)
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusOK, resp)
}

type createStoreDTO struct {
	Name            string     `json:"name"`
	Address         string     `json:"address"`
	ThumbnailURL    string     `json:"thumbnail_url"`
	OpenedAt        *time.Time `json:"opened_at"`
	Description     *string    `json:"description"`
	OpeningHours    *string    `json:"opening_hours"`
	LandscapePhotos []string   `json:"landscape_photos"`
	Latitude        float64    `json:"latitude"`
	Longitude       float64    `json:"longitude"`
	PlaceID         string     `json:"place_id"`
}

func (dto createStoreDTO) toCommand() handlers.CreateStoreCommand {
	return handlers.CreateStoreCommand{
		Name:            dto.Name,
		Address:         dto.Address,
		ThumbnailURL:    dto.ThumbnailURL,
		OpenedAt:        dto.OpenedAt,
		Description:     dto.Description,
		OpeningHours:    dto.OpeningHours,
		LandscapePhotos: append([]string(nil), dto.LandscapePhotos...),
		Latitude:        dto.Latitude,
		Longitude:       dto.Longitude,
		PlaceID:         dto.PlaceID,
	}
}

func (h *StoreHandler) CreateStore(c echo.Context) error {
	var dto createStoreDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	store, err := h.controller.CreateStore(c.Request().Context(), dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusCreated, resp)
}

type updateStoreDTO struct {
	Name            *string    `json:"name"`
	Address         *string    `json:"address"`
	ThumbnailURL    *string    `json:"thumbnail_url"`
	OpenedAt        *time.Time `json:"opened_at"`
	Description     *string    `json:"description"`
	OpeningHours    *string    `json:"opening_hours"`
	LandscapePhotos []string   `json:"landscape_photos"`
	Latitude        *float64   `json:"latitude"`
	Longitude       *float64   `json:"longitude"`
	PlaceID         *string    `json:"place_id"`
}

func (dto updateStoreDTO) toCommand() handlers.UpdateStoreCommand {
	return handlers.UpdateStoreCommand{
		Name:            dto.Name,
		Address:         dto.Address,
		ThumbnailURL:    dto.ThumbnailURL,
		OpenedAt:        dto.OpenedAt,
		Description:     dto.Description,
		OpeningHours:    dto.OpeningHours,
		LandscapePhotos: append([]string(nil), dto.LandscapePhotos...),
		Latitude:        dto.Latitude,
		Longitude:       dto.Longitude,
		PlaceID:         dto.PlaceID,
	}
}

func (h *StoreHandler) UpdateStore(c echo.Context) error {
	id, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	var dto updateStoreDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid body")
	}
	store, err := h.controller.UpdateStore(c.Request().Context(), id, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusOK, resp)
}

func (h *StoreHandler) DeleteStore(c echo.Context) error {
	id, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	if err := h.controller.DeleteStore(c.Request().Context(), id); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}
