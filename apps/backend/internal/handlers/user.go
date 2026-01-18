package handlers

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type UserHandler struct {
	userUseCase input.UserUseCase
	storage     output.StorageProvider
	bucket      string
}

func NewUserHandler(userUseCase input.UserUseCase, storage output.StorageProvider, bucket string) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
		storage:     storage,
		bucket:      bucket,
	}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	userFromCtx, err := getRequiredUser(c)
	if err != nil {
		return err
	}

	user, err := h.userUseCase.FindByID(c.Request().Context(), userFromCtx.UserID)
	if err != nil {
		return err
	}

	resp := presenter.NewUserResponse(user)
	return c.JSON(http.StatusOK, resp)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	user, err := getRequiredUser(c)
	if err != nil {
		return err
	}

	var dto updateUserDTO
	if err = bindJSON(c, &dto); err != nil {
		return err
	}
	userID := c.Param("id")
	if userID != user.UserID {
		return usecase.ErrForbidden
	}
	newUser, err := h.userUseCase.UpdateUser(c.Request().Context(), userID, dto.toInput())
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
	resp := presenter.NewReviewResponses(reviews)
	attachSignedURLsToReviewResponses(c.Request().Context(), h.storage, h.bucket, resp)
	return c.JSON(http.StatusOK, resp)
}

type updateUserDTO struct {
	Name       *string    `json:"name"`
	IconURL    *string    `json:"icon_url"`
	IconFileID *string    `json:"icon_file_id"`
	Gender     *string    `json:"gender"`
	Birthday   *time.Time `json:"birthday"`
}

func (dto updateUserDTO) toInput() input.UpdateUserInput {
	return input.UpdateUserInput{
		Name:       dto.Name,
		IconURL:    dto.IconURL,
		IconFileID: dto.IconFileID,
		Gender:     dto.Gender,
		Birthday:   dto.Birthday,
	}
}
