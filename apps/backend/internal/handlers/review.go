package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/interactor"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
	"github.com/labstack/echo/v4"
)

type ReviewHandler struct{ uc port.ReviewCommandUsecase }

func NewReviewHandler(uc port.ReviewCommandUsecase) *ReviewHandler { return &ReviewHandler{uc: uc} }

func (h *ReviewHandler) Post(c echo.Context) error {
	idStr := c.Param("id")
	storeID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid id"})
	}

	var in struct {
		UserID  string  `json:"user_id"`
		MenuID  int64   `json:"menu_id"`
		Rating  int     `json:"rating"`
		Content *string `json:"content"`
	}
	if err := c.Bind(&in); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	review := domain.Review{StoreID: storeID, UserID: in.UserID, MenuID: in.MenuID, Rating: in.Rating, Content: in.Content, PostedAt: time.Now(), CreatedAt: time.Now()}
	out, err := h.uc.PostReview(review)
	if err == interactor.ErrNotFound {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "not found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, out)
}
