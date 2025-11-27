package httpadapter

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type UserHandler struct {
	controller handlers.UserController
}

func NewUserHandler(controller handlers.UserController) *UserHandler {
	return &UserHandler{controller: controller}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userID := requestcontext.UserID(c)
	user, err := h.controller.GetMe(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusOK, resp)
}

type updateUserDTO struct {
	Name     *string    `json:"name"`
	IconURL  *string    `json:"icon_url"`
	Gender   *string    `json:"gender"`
	Birthday *time.Time `json:"birthday"`
}

func (dto updateUserDTO) toCommand() handlers.UpdateUserCommand {
	return handlers.UpdateUserCommand{
		Name:     dto.Name,
		IconURL:  dto.IconURL,
		Gender:   dto.Gender,
		Birthday: dto.Birthday,
	}
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	var dto updateUserDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid body")
	}
	userID := c.Param("id")
	currentUserID := requestcontext.UserID(c)
	user, err := h.controller.UpdateUser(c.Request().Context(), userID, currentUserID, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) GetUserReviews(c echo.Context) error {
	reviews, err := h.controller.GetUserReviews(c.Request().Context(), c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReviewResponses(reviews))
}
