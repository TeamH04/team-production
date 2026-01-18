package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// addFavoriteRequest represents the request body for adding a favorite
type addFavoriteRequest struct {
	StoreID string `json:"store_id"`
}

// --- GetUserFavorites Tests ---

func TestFavoriteHandler_GetUserFavorites_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/me/favorites")

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		GetMyFavoritesResult: []entity.Favorite{
			{UserID: testUserID, StoreID: "store-1"},
			{UserID: testUserID, StoreID: "store-2"},
		},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetMyFavorites(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response []map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if len(response) != 2 {
		t.Errorf("expected 2 favorites, got %d", len(response))
	}
}

func TestFavoriteHandler_GetUserFavorites_Empty(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/me/favorites")

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		GetMyFavoritesResult: []entity.Favorite{},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetMyFavorites(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestFavoriteHandler_GetUserFavorites_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/me/favorites")

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		GetMyFavoritesErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetMyFavorites(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// TestFavoriteHandler_GetUserFavorites_Unauthorized tests that unauthenticated requests
// are properly rejected when trying to get user favorites.
func TestFavoriteHandler_GetUserFavorites_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/me/favorites")
	// Note: No user is set - request is unauthenticated

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetMyFavorites(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

// TestFavoriteHandler_GetUserFavorites_NilResult tests when the use case returns nil
// (as opposed to an empty slice). The handler should handle this gracefully.
func TestFavoriteHandler_GetUserFavorites_NilResult(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/me/favorites")

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		GetMyFavoritesResult: nil, // Explicitly nil
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetMyFavorites(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// --- AddFavorite Tests ---

func TestFavoriteHandler_AddFavorite_Success(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal for JSON body
	reqBody := addFavoriteRequest{
		StoreID: storeID,
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", string(bodyBytes))

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddResult: &entity.Favorite{UserID: testUserID, StoreID: storeID},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != testUserID {
		t.Errorf("expected user_id %q, got %v", testUserID, response["user_id"])
	}
}

func TestFavoriteHandler_AddFavorite_Unauthorized(t *testing.T) {
	// Use struct literal for JSON body
	reqBody := addFavoriteRequest{
		StoreID: "store-1",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", string(bodyBytes))

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestFavoriteHandler_AddFavorite_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", `{invalid}`)

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestFavoriteHandler_AddFavorite_AlreadyExists(t *testing.T) {
	// Use struct literal for JSON body
	reqBody := addFavoriteRequest{
		StoreID: "store-1",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", string(bodyBytes))

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddErr: usecase.ErrAlreadyFavorite,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "already favorite")
}

// TestFavoriteHandler_AddFavorite_EmptyStoreID tests adding a favorite with an empty store_id.
// This validates that the handler properly propagates validation errors from the use case.
func TestFavoriteHandler_AddFavorite_EmptyStoreID(t *testing.T) {
	// Use struct literal for JSON body with empty store_id
	reqBody := addFavoriteRequest{
		StoreID: "",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", string(bodyBytes))

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "invalid input")
}

// TestFavoriteHandler_AddFavorite_StoreNotFound tests adding a favorite for a non-existent store.
func TestFavoriteHandler_AddFavorite_StoreNotFound(t *testing.T) {
	storeID := uuid.New().String()

	reqBody := addFavoriteRequest{
		StoreID: storeID,
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", string(bodyBytes))

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "store not found")
}

// --- RemoveFavorite Tests ---

func TestFavoriteHandler_RemoveFavorite_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/favorites/"+storeID)
	tc.SetPath("/favorites/:store_id", []string{"store_id"}, []string{storeID})

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.RemoveFavorite(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusNoContent)
}

func TestFavoriteHandler_RemoveFavorite_Unauthorized(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/favorites/"+storeID)
	tc.SetPath("/favorites/:store_id", []string{"store_id"}, []string{storeID})

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.RemoveFavorite(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestFavoriteHandler_RemoveFavorite_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/favorites/invalid-uuid")
	tc.SetPath("/favorites/:store_id", []string{"store_id"}, []string{"invalid-uuid"})

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.RemoveFavorite(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestFavoriteHandler_RemoveFavorite_NotFound(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/favorites/"+storeID)
	tc.SetPath("/favorites/:store_id", []string{"store_id"}, []string{storeID})

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		RemoveErr: usecase.ErrFavoriteNotFound,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.RemoveFavorite(tc.Context)

	testutil.AssertError(t, err, "favorite not found")
}
