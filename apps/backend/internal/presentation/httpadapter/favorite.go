package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type FavoriteHandler struct {
	controller handlers.FavoriteController
}

func NewFavoriteHandler(controller handlers.FavoriteController) *FavoriteHandler {
	return &FavoriteHandler{controller: controller}
}

func (h *FavoriteHandler) GetUserFavorites(c echo.Context) error {
	favorites, err := h.controller.GetUserFavorites(c.Request().Context(), c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewFavoriteResponses(favorites))
}

type addFavoriteDTO struct {
	StoreID int64 `json:"store_id"`
}

func (dto addFavoriteDTO) toCommand() handlers.AddFavoriteCommand {
	return handlers.AddFavoriteCommand{StoreID: dto.StoreID}
}

func (h *FavoriteHandler) AddFavorite(c echo.Context) error {
	var dto addFavoriteDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	userID := c.Param("id")
	currentUserID := requestcontext.UserID(c)
	favorite, err := h.controller.AddFavorite(c.Request().Context(), userID, currentUserID, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewFavoriteResponse(*favorite)
	return c.JSON(http.StatusCreated, resp)
}

func (h *FavoriteHandler) RemoveFavorite(c echo.Context) error {
	storeID, err := parseInt64Param(c, "store_id", "invalid store_id")
	if err != nil {
		return err
	}
	userID := c.Param("id")
	currentUserID := requestcontext.UserID(c)
	if err := h.controller.RemoveFavorite(c.Request().Context(), userID, currentUserID, storeID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}
