package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type ReviewHandler struct {
	controller handlers.ReviewController
}

func NewReviewHandler(controller handlers.ReviewController) *ReviewHandler {
	return &ReviewHandler{controller: controller}
}

func (h *ReviewHandler) GetReviewsByStoreID(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	reviews, err := h.controller.GetReviewsByStoreID(c.Request().Context(), storeID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReviewResponses(reviews))
}

type createReviewDTO struct {
	MenuID    int64    `json:"menu_id"`
	Rating    int      `json:"rating"`
	Content   *string  `json:"content"`
	ImageURLs []string `json:"image_urls"`
}

func (dto createReviewDTO) toCommand() handlers.CreateReviewCommand {
	return handlers.CreateReviewCommand{
		MenuID:    dto.MenuID,
		Rating:    dto.Rating,
		Content:   dto.Content,
		ImageURLs: append([]string(nil), dto.ImageURLs...),
	}
}

func (h *ReviewHandler) CreateReview(c echo.Context) error {
	storeID, err := parseInt64Param(c, "id", "invalid store id")
	if err != nil {
		return err
	}
	var dto createReviewDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	userID := requestcontext.UserID(c)
	review, err := h.controller.CreateReview(c.Request().Context(), storeID, userID, dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewReviewResponse(*review)
	return c.JSON(http.StatusCreated, resp)
}
