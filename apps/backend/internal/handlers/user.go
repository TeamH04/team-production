package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type UserHandler struct {
	userUseCase input.UserUseCase
}

type UpdateUserCommand struct {
	Name       *string
	IconURL    *string
	IconFileID *string
	Gender     *string
	Birthday   *time.Time
}

func (c UpdateUserCommand) toInput() input.UpdateUserInput {
	return input.UpdateUserInput{
		Name:       c.Name,
		IconURL:    c.IconURL,
		IconFileID: c.IconFileID,
		Gender:     c.Gender,
		Birthday:   c.Birthday,
	}
}

func NewUserHandler(userUseCase input.UserUseCase) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
	}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userFromCtx, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	user, err := h.userUseCase.FindByID(c.Request().Context(), userFromCtx.UserID)
	if err != nil {
		return err
	}

	resp := presenter.NewUserResponse(user)
	return c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	var dto updateUserDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid body")
	}
	userID := c.Param("id")
	if userID != user.UserID {
		return usecase.ErrForbidden
	}
	newUser, err := h.userUseCase.UpdateUser(c.Request().Context(), userID, dto.toCommand().toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(newUser)
	return c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) GetUserReviews(c echo.Context) error {
	reviews, err := h.userUseCase.GetUserReviews(c.Request().Context(), c.Param("id"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReviewResponses(reviews))
}

type updateUserDTO struct {
	Name       *string    `json:"name"`
	IconURL    *string    `json:"icon_url"`
	IconFileID *string    `json:"icon_file_id"`
	Gender     *string    `json:"gender"`
	Birthday   *time.Time `json:"birthday"`
}

func (dto updateUserDTO) toCommand() UpdateUserCommand {
	return UpdateUserCommand{
		Name:       dto.Name,
		IconURL:    dto.IconURL,
		IconFileID: dto.IconFileID,
		Gender:     dto.Gender,
		Birthday:   dto.Birthday,
	}
}
