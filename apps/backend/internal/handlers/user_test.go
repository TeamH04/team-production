package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- GetMe Tests ---

func TestUserHandler_GetMe_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/me")

	user := entity.User{UserID: "user-1", Email: "test@example.com", Name: "Test User"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{
		FindByIDResult: user,
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetMe(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != "user-1" {
		t.Errorf("expected user_id 'user-1', got %v", response["user_id"])
	}
}

func TestUserHandler_GetMe_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/me")

	mockUC := &testutil.MockUserUseCase{}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetMe(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestUserHandler_GetMe_UserNotFound(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/me")

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{
		FindByIDErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetMe(tc.Context)

	testutil.AssertError(t, err, "user not found")
}

// --- UpdateUser Tests ---

func TestUserHandler_UpdateUser_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/users/user-1", `{"name":"Updated Name"}`)
	tc.SetPath("/users/:id", []string{"id"}, []string{"user-1"})

	user := entity.User{UserID: "user-1", Email: "test@example.com", Name: "Test User"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{
		UpdateUserResult: entity.User{UserID: "user-1", Name: "Updated Name"},
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateUser(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != "user-1" {
		t.Errorf("expected user_id 'user-1', got %v", response["user_id"])
	}
}

func TestUserHandler_UpdateUser_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/users/user-1", `{"name":"Updated Name"}`)
	tc.SetPath("/users/:id", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockUserUseCase{}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateUser(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestUserHandler_UpdateUser_Forbidden(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/users/other-user", `{"name":"Updated Name"}`)
	tc.SetPath("/users/:id", []string{"id"}, []string{"other-user"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateUser(tc.Context)

	testutil.AssertError(t, err, "forbidden")
}

func TestUserHandler_UpdateUser_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/users/user-1", `{invalid}`)
	tc.SetPath("/users/:id", []string{"id"}, []string{"user-1"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateUser(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestUserHandler_UpdateUser_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/users/user-1", `{"name":"Updated Name"}`)
	tc.SetPath("/users/:id", []string{"id"}, []string{"user-1"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockUserUseCase{
		UpdateUserErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateUser(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- GetUserReviews Tests ---

func TestUserHandler_GetUserReviews_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/reviews")
	tc.SetPath("/users/:id/reviews", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockUserUseCase{
		GetUserReviewsResult: []entity.Review{
			{ReviewID: "review-1", UserID: "user-1"},
			{ReviewID: "review-2", UserID: "user-1"},
		},
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetUserReviews(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response []map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if len(response) != 2 {
		t.Errorf("expected 2 reviews, got %d", len(response))
	}
}

func TestUserHandler_GetUserReviews_Empty(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/reviews")
	tc.SetPath("/users/:id/reviews", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockUserUseCase{
		GetUserReviewsResult: []entity.Review{},
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetUserReviews(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestUserHandler_GetUserReviews_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/reviews")
	tc.SetPath("/users/:id/reviews", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockUserUseCase{
		GetUserReviewsErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewUserHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.GetUserReviews(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
