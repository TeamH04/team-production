package handlers_test

import (
	"net/http"
	"testing"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- GetUserFavorites Tests ---

func TestFavoriteHandler_GetUserFavorites_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/favorites")
	tc.SetPath("/users/:id/favorites", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockFavoriteUseCase{
		GetUserFavoritesResult: []entity.Favorite{
			{UserID: "user-1", StoreID: "store-1"},
			{UserID: "user-1", StoreID: "store-2"},
		},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetUserFavorites(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestFavoriteHandler_GetUserFavorites_Empty(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/favorites")
	tc.SetPath("/users/:id/favorites", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockFavoriteUseCase{
		GetUserFavoritesResult: []entity.Favorite{},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetUserFavorites(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestFavoriteHandler_GetUserFavorites_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/users/user-1/favorites")
	tc.SetPath("/users/:id/favorites", []string{"id"}, []string{"user-1"})

	mockUC := &testutil.MockFavoriteUseCase{
		GetUserFavoritesErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.GetUserFavorites(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- AddFavorite Tests ---

func TestFavoriteHandler_AddFavorite_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", `{"store_id":"`+storeID+`"}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddResult: &entity.Favorite{UserID: "user-1", StoreID: storeID},
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

func TestFavoriteHandler_AddFavorite_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", `{"store_id":"store-1"}`)

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestFavoriteHandler_AddFavorite_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", `{invalid}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestFavoriteHandler_AddFavorite_AlreadyExists(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/favorites", `{"store_id":"store-1"}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		AddErr: usecase.ErrAlreadyFavorite,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.AddFavorite(tc.Context)

	testutil.AssertError(t, err, "already favorite")
}

// --- RemoveFavorite Tests ---

func TestFavoriteHandler_RemoveFavorite_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodDelete, "/favorites/"+storeID)
	tc.SetPath("/favorites/:store_id", []string{"store_id"}, []string{storeID})

	user := entity.User{UserID: "user-1"}
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

	user := entity.User{UserID: "user-1"}
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

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockFavoriteUseCase{
		RemoveErr: usecase.ErrFavoriteNotFound,
	}
	h := handlers.NewFavoriteHandler(mockUC)

	err := h.RemoveFavorite(tc.Context)

	testutil.AssertError(t, err, "favorite not found")
}
