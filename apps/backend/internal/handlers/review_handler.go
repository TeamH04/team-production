package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
)

type ReviewHandler struct {
	reviewUseCase interactor.ReviewUseCase
}

// NewReviewHandler は ReviewHandler を生成します
func NewReviewHandler(reviewUseCase interactor.ReviewUseCase) *ReviewHandler {
	return &ReviewHandler{
		reviewUseCase: reviewUseCase,
	}
}

// GetReviewsByStoreID は指定されたストアのレビューを取得します
// GET /api/stores/:id/reviews
func (h *ReviewHandler) GetReviewsByStoreID(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	reviews, err := h.reviewUseCase.GetReviewsByStoreID(ctx, storeID)
	if err != nil {
		if errors.Is(err, interactor.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, reviews)
}

// CreateReview は新しいレビューを作成します
// POST /api/stores/:id/reviews
func (h *ReviewHandler) CreateReview(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid store id"})
	}

	var req interactor.CreateReviewInput
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	review, err := h.reviewUseCase.CreateReview(ctx, storeID, req)
	if err != nil {
		if errors.Is(err, interactor.ErrStoreNotFound) {
			return c.JSON(http.StatusNotFound, echo.Map{"error": "store not found"})
		}
		if errors.Is(err, interactor.ErrInvalidInput) || errors.Is(err, interactor.ErrInvalidRating) {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, review)
}
