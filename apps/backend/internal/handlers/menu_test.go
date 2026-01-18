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

// createMenuRequest represents the request body for creating a menu
type createMenuRequest struct {
	Name        string  `json:"name"`
	Price       *int    `json:"price,omitempty"`
	Description *string `json:"description,omitempty"`
}

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

	// Verify response body contains expected menus
	var response []map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if len(response) != 2 {
		t.Errorf("expected 2 menus, got %d", len(response))
	}
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

// TestMenuHandler_GetMenusByStoreID_NilResult tests when the use case returns nil
// (as opposed to an empty slice). The handler should handle this gracefully.
func TestMenuHandler_GetMenusByStoreID_NilResult(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		GetByStoreIDResult: nil, // Explicitly nil
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// TestMenuHandler_GetMenusByStoreID_ManyMenus tests retrieval of a larger number of menus.
func TestMenuHandler_GetMenusByStoreID_ManyMenus(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/stores/"+storeID+"/menus")
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	// Create multiple menus
	menus := make([]entity.Menu, 10)
	for i := 0; i < 10; i++ {
		menus[i] = entity.Menu{
			MenuID:  uuid.New().String(),
			StoreID: storeID,
			Name:    "Menu " + string(rune('A'+i)),
		}
	}

	mockUC := &testutil.MockMenuUseCase{
		GetByStoreIDResult: menus,
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.GetMenusByStoreID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

// --- CreateMenu Tests ---

func TestMenuHandler_CreateMenu_Success(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal for JSON body
	reqBody := createMenuRequest{
		Name:        "New Menu",
		Price:       testutil.IntPtr(1000),
		Description: testutil.StringPtr("Delicious"),
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
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
	// Use struct literal for JSON body
	reqBody := createMenuRequest{
		Name: "New Menu",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/invalid-uuid/menus", string(bodyBytes))
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

	// Use struct literal for JSON body
	reqBody := createMenuRequest{
		Name: "New Menu",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// TestMenuHandler_CreateMenu_OnlyName tests creating a menu with only the required name field.
// Price and description are optional and should be nil.
func TestMenuHandler_CreateMenu_OnlyName(t *testing.T) {
	storeID := uuid.New().String()

	// Use struct literal with only name (price and description are nil)
	reqBody := createMenuRequest{
		Name: "Simple Menu",
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateResult: &entity.Menu{
			MenuID:  "menu-1",
			StoreID: storeID,
			Name:    "Simple Menu",
		},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

// TestMenuHandler_CreateMenu_WithPriceOnly tests creating a menu with name and price only.
func TestMenuHandler_CreateMenu_WithPriceOnly(t *testing.T) {
	storeID := uuid.New().String()

	reqBody := createMenuRequest{
		Name:  "Priced Menu",
		Price: testutil.IntPtr(500),
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateResult: &entity.Menu{
			MenuID:  "menu-1",
			StoreID: storeID,
			Name:    "Priced Menu",
		},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}

// TestMenuHandler_CreateMenu_EmptyName tests that creating a menu with an empty name
// results in a validation error from the use case.
func TestMenuHandler_CreateMenu_EmptyName(t *testing.T) {
	storeID := uuid.New().String()

	// Empty name should cause validation error
	reqBody := createMenuRequest{
		Name:  "",
		Price: testutil.IntPtr(1000),
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertError(t, err, "invalid input")
}

// TestMenuHandler_CreateMenu_ZeroPrice tests creating a menu with zero price.
// Zero is a valid price (e.g., free items).
func TestMenuHandler_CreateMenu_ZeroPrice(t *testing.T) {
	storeID := uuid.New().String()

	reqBody := createMenuRequest{
		Name:  "Free Item",
		Price: testutil.IntPtr(0),
	}
	bodyBytes := testutil.MustMarshal(t, reqBody)

	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/stores/"+storeID+"/menus", string(bodyBytes))
	tc.SetPath("/stores/:id/menus", []string{"id"}, []string{storeID})

	mockUC := &testutil.MockMenuUseCase{
		CreateResult: &entity.Menu{
			MenuID:  "menu-1",
			StoreID: storeID,
			Name:    "Free Item",
		},
	}
	h := handlers.NewMenuHandler(mockUC)

	err := h.CreateMenu(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)
}
