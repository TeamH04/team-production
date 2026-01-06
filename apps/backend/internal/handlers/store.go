package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type StoreHandler struct {
	storeUseCase input.StoreUseCase
}

type CreateStoreCommand struct {
	Name            string
	Address         string
	ThumbnailFileID *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	Latitude        float64
	Longitude       float64
	GoogleMapURL    *string
	PlaceID         string
}

func (c CreateStoreCommand) toInput() input.CreateStoreInput {
	return input.CreateStoreInput{
		Name:            c.Name,
		Address:         c.Address,
		ThumbnailFileID: c.ThumbnailFileID,
		OpenedAt:        c.OpenedAt,
		Description:     c.Description,
		OpeningHours:    c.OpeningHours,
		Latitude:        c.Latitude,
		Longitude:       c.Longitude,
		GoogleMapURL:    c.GoogleMapURL,
		PlaceID:         c.PlaceID,
	}
}

type UpdateStoreCommand struct {
	Name            *string
	Address         *string
	ThumbnailFileID *string
	OpenedAt        *time.Time
	Description     *string
	OpeningHours    *string
	Latitude        *float64
	Longitude       *float64
	GoogleMapURL    *string
	PlaceID         *string
}

func (c UpdateStoreCommand) toInput() input.UpdateStoreInput {
	return input.UpdateStoreInput{
		Name:            c.Name,
		Address:         c.Address,
		ThumbnailFileID: c.ThumbnailFileID,
		OpenedAt:        c.OpenedAt,
		Description:     c.Description,
		OpeningHours:    c.OpeningHours,
		Latitude:        c.Latitude,
		Longitude:       c.Longitude,
		GoogleMapURL:    c.GoogleMapURL,
		PlaceID:         c.PlaceID,
	}
}

func NewStoreHandler(storeUseCase input.StoreUseCase) *StoreHandler {
	return &StoreHandler{
		storeUseCase: storeUseCase,
	}
}

func (h *StoreHandler) GetStores(c echo.Context) error {
	stores, err := h.storeUseCase.GetAllStores(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewStoreResponses(stores))
}

func (h *StoreHandler) GetStoreByID(c echo.Context) error {
	id, err := parseUUIDParam(c, "id", "invalid id")
	if err != nil {
		return err
	}
	store, err := h.storeUseCase.GetStoreByID(c.Request().Context(), id)
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusOK, resp)
}

func (h *StoreHandler) CreateStore(c echo.Context) error {
	var dto createStoreDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	store, err := h.storeUseCase.CreateStore(c.Request().Context(), dto.toCommand().toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusCreated, resp)
}

func (h *StoreHandler) UpdateStore(c echo.Context) error {
	id, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	var dto updateStoreDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid body")
	}
	store, err := h.storeUseCase.UpdateStore(c.Request().Context(), id, dto.toCommand().toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewStoreResponse(*store)
	return c.JSON(http.StatusOK, resp)
}

func (h *StoreHandler) DeleteStore(c echo.Context) error {
	id, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	if err := h.storeUseCase.DeleteStore(c.Request().Context(), id); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

type createStoreDTO struct {
	Name            string     `json:"name"`
	Address         string     `json:"address"`
	ThumbnailFileID *string    `json:"thumbnail_file_id"`
	OpenedAt        *time.Time `json:"opened_at"`
	Description     *string    `json:"description"`
	OpeningHours    *string    `json:"opening_hours"`
	Latitude        float64    `json:"latitude"`
	Longitude       float64    `json:"longitude"`
	GoogleMapURL    *string    `json:"google_map_url"`
	PlaceID         string     `json:"place_id"`
}

func (dto createStoreDTO) toCommand() CreateStoreCommand {
	return CreateStoreCommand{
		Name:            dto.Name,
		Address:         dto.Address,
		ThumbnailFileID: dto.ThumbnailFileID,
		OpenedAt:        dto.OpenedAt,
		Description:     dto.Description,
		OpeningHours:    dto.OpeningHours,
		Latitude:        dto.Latitude,
		Longitude:       dto.Longitude,
		GoogleMapURL:    dto.GoogleMapURL,
		PlaceID:         dto.PlaceID,
	}
}

type updateStoreDTO struct {
	Name            *string    `json:"name"`
	Address         *string    `json:"address"`
	ThumbnailFileID *string    `json:"thumbnail_file_id"`
	OpenedAt        *time.Time `json:"opened_at"`
	Description     *string    `json:"description"`
	OpeningHours    *string    `json:"opening_hours"`
	Latitude        *float64   `json:"latitude"`
	Longitude       *float64   `json:"longitude"`
	GoogleMapURL    *string    `json:"google_map_url"`
	PlaceID         *string    `json:"place_id"`
}

func (dto updateStoreDTO) toCommand() UpdateStoreCommand {
	return UpdateStoreCommand{
		Name:            dto.Name,
		Address:         dto.Address,
		ThumbnailFileID: dto.ThumbnailFileID,
		OpenedAt:        dto.OpenedAt,
		Description:     dto.Description,
		OpeningHours:    dto.OpeningHours,
		Latitude:        dto.Latitude,
		Longitude:       dto.Longitude,
		GoogleMapURL:    dto.GoogleMapURL,
		PlaceID:         dto.PlaceID,
	}
}
