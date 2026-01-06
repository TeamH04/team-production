package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type ReviewHandler struct {
	reviewUseCase input.ReviewUseCase
	tokenVerifier security.TokenVerifier
}

func NewReviewHandler(reviewUseCase input.ReviewUseCase, tokenVerifier security.TokenVerifier) *ReviewHandler {
	return &ReviewHandler{
		reviewUseCase: reviewUseCase,
		tokenVerifier: tokenVerifier,
	}
}

func (h *ReviewHandler) GetReviewsByStoreID(c echo.Context) error {
	storeID, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}

	sort := c.QueryParam("sort")
	viewerID := ""
	if token := bearerTokenFromHeader(c.Request().Header.Get("Authorization")); token != "" {
		claims, err := h.tokenVerifier.Verify(token)
		if err != nil {
			return usecase.ErrUnauthorized
		}
		viewerID = claims.UserID
	}

	reviews, err := h.reviewUseCase.GetReviewsByStoreID(c.Request().Context(), storeID, sort, viewerID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewReviewResponses(reviews))
}

func (h *ReviewHandler) CreateReview(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	storeID, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}

	var input input.CreateReview
	if err := c.Bind(&input); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	review, err := h.reviewUseCase.CreateReview(c.Request().Context(), storeID, user.UserID, input)
	if err != nil {
		return err
	}
	resp := presenter.NewReviewResponse(*review)
	return c.JSON(http.StatusCreated, resp)
}

func (h *ReviewHandler) LikeReview(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	reviewID, err := parseUUIDParam(c, "id", "invalid review id")
	if err != nil {
		return err
	}

	if err := h.reviewUseCase.LikeReview(c.Request().Context(), reviewID, user.UserID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *ReviewHandler) UnlikeReview(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	reviewID, err := parseUUIDParam(c, "id", "invalid review id")
	if err != nil {
		return err
	}

	if err := h.reviewUseCase.UnlikeReview(c.Request().Context(), reviewID, user.UserID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}
