package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type FavoriteHandler struct {
	favoriteUseCase input.FavoriteUseCase
}

type AddFavoriteCommand struct {
	StoreID string
}

func NewFavoriteHandler(favoriteUseCase input.FavoriteUseCase) *FavoriteHandler {
	return &FavoriteHandler{
		favoriteUseCase: favoriteUseCase,
	}
}

func (h *FavoriteHandler) GetUserFavorites(c echo.Context) error {
	favorites, err := h.favoriteUseCase.GetUserFavorites(c.Request().Context(), c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewFavoriteResponses(favorites))
}

func (h *FavoriteHandler) AddFavorite(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	var dto addFavoriteDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	favorite, err := h.favoriteUseCase.AddFavorite(c.Request().Context(), user.UserID, dto.StoreID)
	if err != nil {
		return err
	}
	resp := presenter.NewFavoriteResponse(*favorite)
	return c.JSON(http.StatusCreated, resp)
}

func (h *FavoriteHandler) RemoveFavorite(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	storeID, err := parseUUIDParam(c, "store_id", "invalid store_id")
	if err != nil {
		return err
	}

	if err := h.favoriteUseCase.RemoveFavorite(c.Request().Context(), user.UserID, storeID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

type addFavoriteDTO struct {
	StoreID string `json:"store_id"`
}
