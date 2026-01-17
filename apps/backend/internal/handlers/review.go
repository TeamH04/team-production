package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type ReviewHandler struct {
	reviewUseCase input.ReviewUseCase
	tokenVerifier security.TokenVerifier
	storage       output.StorageProvider
	bucket        string
}

func NewReviewHandler(
	reviewUseCase input.ReviewUseCase,
	tokenVerifier security.TokenVerifier,
	storage output.StorageProvider,
	bucket string,
) *ReviewHandler {
	return &ReviewHandler{
		reviewUseCase: reviewUseCase,
		tokenVerifier: tokenVerifier,
		storage:       storage,
		bucket:        bucket,
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
		claims, err := h.tokenVerifier.Verify(c.Request().Context(), token)
		if err == nil {
			viewerID = claims.UserID
		}
		// 無効なトークンでもエラーを返さず、viewerIDを空のまま続行
	}

	reviews, err := h.reviewUseCase.GetReviewsByStoreID(c.Request().Context(), storeID, sort, viewerID)
	if err != nil {
		return err
	}
	resp := presenter.NewReviewResponses(reviews)
	attachSignedURLsToReviewResponses(c.Request().Context(), h.storage, h.bucket, resp)
	return c.JSON(http.StatusOK, resp)
}

func (h *ReviewHandler) Create(c echo.Context) error {
	user, err := getRequiredUser(c)
	if err != nil {
		return err
	}

	storeID, err := parseUUIDParam(c, "id", "invalid store id")
	if err != nil {
		return err
	}

	var in input.CreateReview
	if err := bindJSON(c, &in); err != nil {
		return err
	}

	if err := h.reviewUseCase.Create(c.Request().Context(), storeID, user.UserID, in); err != nil {
		return err
	}
	return c.NoContent(http.StatusCreated)
}

func (h *ReviewHandler) LikeReview(c echo.Context) error {
	user, err := getRequiredUser(c)
	if err != nil {
		return err
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
	user, err := getRequiredUser(c)
	if err != nil {
		return err
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
