package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// mockStoreUseCase implements input.StoreUseCase for testing
type mockStoreUseCase struct {
	stores         []entity.Store
	store          *entity.Store
	getAllErr      error
	getByIDErr     error
	createErr      error
	updateErr      error
	deleteErr      error
	createdStore   *entity.Store
}

func (m *mockStoreUseCase) GetAllStores(ctx context.Context) ([]entity.Store, error) {
	if m.getAllErr != nil {
		return nil, m.getAllErr
	}
	return m.stores, nil
}

func (m *mockStoreUseCase) GetStoreByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.getByIDErr != nil {
		return nil, m.getByIDErr
	}
	return m.store, nil
}

func (m *mockStoreUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*entity.Store, error) {
	if m.createErr != nil {
		return nil, m.createErr
	}
	if m.createdStore != nil {
		return m.createdStore, nil
	}
	return &entity.Store{
		StoreID: "new-store-id",
		Name:    in.Name,
		Address: in.Address,
	}, nil
}

func (m *mockStoreUseCase) UpdateStore(ctx context.Context, id string, in input.UpdateStoreInput) (*entity.Store, error) {
	if m.updateErr != nil {
		return nil, m.updateErr
	}
	return m.store, nil
}

func (m *mockStoreUseCase) DeleteStore(ctx context.Context, id string) error {
	return m.deleteErr
}

// --- GetStores Tests ---

func TestStoreHandler_GetStores_Success(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{
		stores: []entity.Store{
			{StoreID: "store-1", Name: "Store 1"},
			{StoreID: "store-2", Name: "Store 2"},
		},
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStores(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	var response []map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if len(response) != 2 {
		t.Errorf("expected 2 stores in response, got %d", len(response))
	}
}

func TestStoreHandler_GetStores_Empty(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{
		stores: []entity.Store{},
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStores(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestStoreHandler_GetStores_UseCaseError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{
		getAllErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStores(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// --- GetStoreByID Tests ---

func TestStoreHandler_GetStoreByID_Success(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	req := httptest.NewRequest(http.MethodGet, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{
		store: &entity.Store{StoreID: storeID, Name: "Test Store"},
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStoreByID(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestStoreHandler_GetStoreByID_InvalidUUID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStoreByID(c)

	if err == nil {
		t.Fatal("expected error for invalid UUID, got nil")
	}
}

func TestStoreHandler_GetStoreByID_NotFound(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	req := httptest.NewRequest(http.MethodGet, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{
		getByIDErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.GetStoreByID(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// --- CreateStore Tests ---

func TestStoreHandler_CreateStore_Success(t *testing.T) {
	e := echo.New()
	body := `{"name":"New Store","address":"New Address","latitude":35.6812,"longitude":139.7671,"place_id":"place-123","thumbnail_file_id":"file-1"}`
	req := httptest.NewRequest(http.MethodPost, "/stores", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{
		createdStore: &entity.Store{
			StoreID: "new-store-id",
			Name:    "New Store",
			Address: "New Address",
		},
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.CreateStore(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d", http.StatusCreated, rec.Code)
	}
}

func TestStoreHandler_CreateStore_InvalidJSON(t *testing.T) {
	e := echo.New()
	body := `{invalid json}`
	req := httptest.NewRequest(http.MethodPost, "/stores", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.CreateStore(c)

	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestStoreHandler_CreateStore_UseCaseError(t *testing.T) {
	e := echo.New()
	body := `{"name":"New Store","address":"New Address","latitude":35.6812,"longitude":139.7671,"place_id":"place-123"}`
	req := httptest.NewRequest(http.MethodPost, "/stores", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockStoreUseCase{
		createErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.CreateStore(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// --- UpdateStore Tests ---

func TestStoreHandler_UpdateStore_Success(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	body := `{"name":"Updated Store"}`
	req := httptest.NewRequest(http.MethodPut, "/stores/"+storeID, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{
		store: &entity.Store{StoreID: storeID, Name: "Updated Store"},
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.UpdateStore(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestStoreHandler_UpdateStore_InvalidUUID(t *testing.T) {
	e := echo.New()
	body := `{"name":"Updated Store"}`
	req := httptest.NewRequest(http.MethodPut, "/stores/invalid-uuid", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.UpdateStore(c)

	if err == nil {
		t.Fatal("expected error for invalid UUID, got nil")
	}
}

func TestStoreHandler_UpdateStore_InvalidJSON(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	body := `{invalid}`
	req := httptest.NewRequest(http.MethodPut, "/stores/"+storeID, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.UpdateStore(c)

	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

// --- DeleteStore Tests ---

func TestStoreHandler_DeleteStore_Success(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	req := httptest.NewRequest(http.MethodDelete, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.DeleteStore(c)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusNoContent {
		t.Errorf("expected status %d, got %d", http.StatusNoContent, rec.Code)
	}
}

func TestStoreHandler_DeleteStore_InvalidUUID(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/stores/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	mockUC := &mockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC)

	err := h.DeleteStore(c)

	if err == nil {
		t.Fatal("expected error for invalid UUID, got nil")
	}
}

func TestStoreHandler_DeleteStore_NotFound(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	req := httptest.NewRequest(http.MethodDelete, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &mockStoreUseCase{
		deleteErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC)

	err := h.DeleteStore(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
