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

// --- GetMenusByStoreID Tests ---

func TestMenuHandler_GetMenusByStoreID_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		GetByStoreIDResult: []entity.Menu{
			{MenuID: "menu-1", StoreID: storeID, Name: "Menu 1"},
			{MenuID: "menu-2", StoreID: storeID, Name: "Menu 2"},
		},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestMenuHandler_GetMenusByStoreID_Empty(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		GetByStoreIDResult: []entity.Menu{},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestMenuHandler_GetMenusByStoreID_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/invalid-uuid/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{"invalid-uuid"})

	mockUC := &testutil.MockMenuUseCase{}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestMenuHandler_GetMenusByStoreID_UseCaseError(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		GetByStoreIDErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- CreateMenu Tests ---

func TestMenuHandler_CreateMenu_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus",
		`{"name":"New Menu","price":1000,"description":"Delicious"}`)
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateResult: &entity.Menu{
			MenuID:  "menu-1",
			StoreID: storeID,
			Name:    "New Menu",
		},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

func TestMenuHandler_CreateMenu_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/invalid-uuid/menus", `{"name":"New Menu"}`)
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{"invalid-uuid"})

	mockUC := &testutil.MockMenuUseCase{}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestMenuHandler_CreateMenu_InvalidJSON(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", `{invalid}`)
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestMenuHandler_CreateMenu_UseCaseError(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", `{"name":"New Menu"}`)
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
