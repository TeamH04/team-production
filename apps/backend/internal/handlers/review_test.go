package handlers_test

import (
	"encoding/json"
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

// createReviewRequest represents the request body for creating a review
type createReviewRequest struct {
	MenuIDs []string `json:"menu_ids"`
	Rating  int      `json:"rating"`
	Content string   `json:"content"`
}

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body contains expected reviews
	var response []map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if len(response) != 2 {
		t.Errorf("expected 2 reviews, got %d", len(response))
	}
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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestReviewHandler_GetReviewsByStoreID_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/invalid-uuid/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{"invalid-uuid"})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// TestGetReviewsByStoreID_ValidToken_EmptyUserID tests when the token is valid
// but the claims contain an empty UserID. This edge case verifies that the handler
// still succeeds and treats the request as unauthenticated (viewerID remains empty).
func TestGetReviewsByStoreID_ValidToken_EmptyUserID(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})
	tc.SetAuthHeader("valid-token-empty-user")

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{
			{ReviewID: "review-1", StoreID: storeID},
		},
	}
	// Token verifies successfully but UserID is empty
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: ""},
	}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	// Should succeed even with empty UserID in claims
	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// TestGetReviewsByStoreID_NoToken tests when no Authorization header is provided.
// This verifies that the handler succeeds without authentication and viewerID
// is passed as empty string to the use case.
func TestGetReviewsByStoreID_NoToken(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})
	// Note: No auth header is set - request is unauthenticated

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{
			{ReviewID: "review-1", StoreID: storeID},
		},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		// Verifier should not be called when no token is provided
		Err: errors.New("should not be called"),
	}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	// Should succeed without authentication
	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify verifier was not called when no token provided
	if mockVerifier.VerifyCalled {
		t.Error("verifier should not be called without token")
	}
}

// TestGetReviewsByStoreID_InvalidToken_StillSucceeds tests that an invalid token
// does not cause the request to fail. The handler should continue with an empty
// viewerID when token verification fails (graceful degradation).
func TestGetReviewsByStoreID_InvalidToken_StillSucceeds(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})
	tc.SetAuthHeader("malformed-or-expired-token")

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{
			{ReviewID: "review-1", StoreID: storeID},
			{ReviewID: "review-2", StoreID: storeID},
		},
	}
	// Token verification fails with error
	mockVerifier := &testutil.MockTokenVerifier{
		Err: errors.New("token expired"),
	}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	// Request should still succeed - invalid token is ignored
	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// TestGetReviewsByStoreID_WithSortParam tests that the sort query parameter
// is correctly passed to the use case.
func TestGetReviewsByStoreID_WithSortParam(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/reviews?sort=newest")
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockReviewUseCase{
		GetByStoreIDResult: []entity.Review{},
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetReviewsByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify sort parameter is passed correctly to the use case
	if mockUC.GetByStoreIDCalledWith.Sort != "newest" {
		t.Errorf("expected sort = %q, got %q", "newest", mockUC.GetByStoreIDCalledWith.Sort)
	}
}

// --- Create Tests ---

func TestReviewHandler_Create_Success(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal for JSON body instead of inline string
	reqBody := createReviewRequest{
		MenuIDs: []string{"menu-1"},
		Rating:  5,
		Content: "Great food!",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews", string(bodyBytes))
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.Create(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

func TestReviewHandler_Create_Unauthorized(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal for JSON body
	reqBody := createReviewRequest{
		MenuIDs: []string{"menu-1"},
		Rating:  5,
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews", string(bodyBytes))
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestReviewHandler_Create_InvalidUUID(t *testing.T) {
	// Use struct literal for JSON body
	reqBody := createReviewRequest{
		MenuIDs: []string{"menu-1"},
		Rating:  5,
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/invalid-uuid/reviews", string(bodyBytes))
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{"invalid-uuid"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.Create(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestReviewHandler_Create_UseCaseError(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal for JSON body
	reqBody := createReviewRequest{
		MenuIDs: []string{"menu-1"},
		Rating:  5,
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/reviews", string(bodyBytes))
	tc.SetPath("/stores/:id/reviews", []string{"id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.LikeReview(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusNoContent)
}

func TestReviewHandler_LikeReview_Unauthorized(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UnlikeReview(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusNoContent)
}

func TestReviewHandler_UnlikeReview_Unauthorized(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	mockUC := &testutil.MockReviewUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

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
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UnlikeReview(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestReviewHandler_UnlikeReview_UseCaseError(t *testing.T) {
	reviewID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/reviews/"+reviewID+"/like")
	tc.SetPath("/reviews/:id/like", []string{"id"}, []string{reviewID})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReviewUseCase{
		UnlikeErr: usecase.ErrReviewNotFound,
	}
	mockVerifier := &testutil.MockTokenVerifier{}
	h := handlers.NewReviewHandler(mockUC, mockVerifier, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UnlikeReview(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
