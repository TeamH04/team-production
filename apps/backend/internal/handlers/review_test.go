package handlers_test

import (
	"errors"
	"net/http"
	"testing"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- GetReviewsByStoreID Tests ---

func TestReviewHandler_GetReviewsByStoreID_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{
			{ReviewID: "review-1", StoreID: storeID},
			{ReviewID: "review-2", StoreID: storeID},
		},
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestReviewHandler_GetReviewsByStoreID_WithAuth(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})
	tc.SetAuthHeader("valid-token")

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1"},
	}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestReviewHandler_GetReviewsByStoreID_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/invalid-uuid/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{"invalid-uuid"})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestReviewHandler_GetReviewsByStoreID_UseCaseError(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDErr: usecase.ErrStoreNotFound,
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

func TestReviewHandler_GetReviewsByStoreID_InvalidTokenContinues(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})
	tc.SetAuthHeader("invalid-token")

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Err: errors.New("invalid token"),
	}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// --- Create Tests ---

func TestReviewHandler_Create_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews",
		`{"menu_ids":["menu-1"],"rating":5,"content":"Great food!"}`)
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.Create(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

func TestReviewHandler_Create_Unauthorized(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews",
		`{"menu_ids":["menu-1"],"rating":5}`)
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestReviewHandler_Create_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/invalid-uuid/reviews",
		`{"menu_ids":["menu-1"],"rating":5}`)
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{"invalid-uuid"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestReviewHandler_Create_InvalidJSON(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews", `{invalid}`)
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestReviewHandler_Create_UseCaseError(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews",
		`{"menu_ids":["menu-1"],"rating":5}`)
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- LikeReview Tests ---

func TestReviewHandler_LikeReview_Success(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.LikeReview(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusNoContent)
}

func TestReviewHandler_LikeReview_Unauthorized(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.LikeReview(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestReviewHandler_LikeReview_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/reviews/invalid-uuid/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{"invalid-uuid"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.LikeReview(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestReviewHandler_LikeReview_UseCaseError(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{
		LikeErr: usecase.ErrReviewNotFound,
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.LikeReview(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- UnlikeReview Tests ---

func TestReviewHandler_UnlikeReview_Success(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.UnlikeReview(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusNoContent)
}

func TestReviewHandler_UnlikeReview_Unauthorized(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.UnlikeReview(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestReviewHandler_UnlikeReview_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/reviews/invalid-uuid/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{"invalid-uuid"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier)

	err := h.UnlikeReview(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}
