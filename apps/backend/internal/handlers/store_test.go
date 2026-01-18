package handlers_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

const testUpdateStoreBody = `{"name":"Updated Store"}`

// --- GetStores Tests ---

func TestStoreHandler_GetStores_Success(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockStoreUseCase{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Store 1"},
			{StoreID: "store-2", Name: "Store 2"},
		},
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		Stores: []entity.Store{},
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		GetAllErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		Store: &entity.Store{StoreID: storeID, Name: "Test Store"},
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		GetByIDErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		CreatedStore: &entity.Store{
			StoreID: "new-store-id",
			Name:    "New Store",
			Address: "New Address",
		},
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.CreateStore(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// --- UpdateStore Tests ---

func TestStoreHandler_UpdateStore_Success(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	body := testUpdateStoreBody
	req := httptest.NewRequest(http.MethodPut, "/stores/"+storeID, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &testutil.MockStoreUseCase{
		Store: &entity.Store{StoreID: storeID, Name: "Updated Store"},
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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
	body := testUpdateStoreBody
	req := httptest.NewRequest(http.MethodPut, "/stores/invalid-uuid", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateStore(c)

	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestStoreHandler_UpdateStore_UseCaseError(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	body := testUpdateStoreBody
	req := httptest.NewRequest(http.MethodPut, "/stores/"+storeID, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &testutil.MockStoreUseCase{
		UpdateErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.UpdateStore(c)

	if err == nil {
		t.Fatal("expected error, got nil")
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

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

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

	mockUC := &testutil.MockStoreUseCase{
		DeleteErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewStoreHandler(mockUC, &testutil.MockStorageProvider{}, "test-bucket")

	err := h.DeleteStore(c)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

// --- Storage Integration Failure Tests ---
// These tests verify that storage signing failures are handled gracefully
// and do not cause the entire request to fail.

// TestGetStoreByID_StorageSigningError verifies that when the storage provider
// returns an error from CreateSignedDownload, the response still succeeds
// but the file URL remains unset (nil).
func TestGetStoreByID_StorageSigningError(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	fileID := uuid.New().String()
	objectKey := "stores/thumbnail.jpg"

	req := httptest.NewRequest(http.MethodGet, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	// Create a store with a thumbnail file that has an object key
	mockUC := &testutil.MockStoreUseCase{
		Store: &entity.Store{
			StoreID: storeID,
			Name:    "Test Store",
			ThumbnailFile: &entity.File{
				FileID:    fileID,
				FileName:  "thumbnail.jpg",
				ObjectKey: objectKey,
			},
		},
	}

	// Configure storage to return an error for all keys
	mockStorage := &testutil.MockStorageProvider{
		CreateSignedDownloadErr: errors.New("storage service unavailable"),
	}

	h := handlers.NewStoreHandler(mockUC, mockStorage, "test-bucket")

	err := h.GetStoreByID(c)
	// The request should still succeed even though storage signing failed
	if err != nil {
		t.Fatalf("unexpected error: %v - storage signing errors should be silent", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Parse the response
	var response presenter.StoreResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	// Verify the store data is present
	if response.StoreID != storeID {
		t.Errorf("expected store_id %s, got %s", storeID, response.StoreID)
	}

	// The thumbnail file should exist but URL should be nil (not signed)
	if response.ThumbnailFile == nil {
		t.Fatal("expected thumbnail_file to be present")
	}
	if response.ThumbnailFile.URL != nil {
		t.Errorf("expected URL to be nil when storage signing fails, got %v", *response.ThumbnailFile.URL)
	}

	// Verify that the storage provider was called
	if len(mockStorage.RequestedKeys) == 0 {
		t.Error("expected storage provider to be called, but no keys were requested")
	}
}

// TestGetStores_StorageSigningPartialFailure verifies that when the storage provider
// fails for some keys but succeeds for others, partial success is handled correctly.
func TestGetStores_StorageSigningPartialFailure(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	store1ID := uuid.New().String()
	store2ID := uuid.New().String()
	file1ID := uuid.New().String()
	file2ID := uuid.New().String()
	objectKey1 := "stores/thumb1.jpg"
	objectKey2 := "stores/thumb2.jpg"

	// Create two stores, each with a thumbnail file
	mockUC := &testutil.MockStoreUseCase{
		Stores: []entity.Store{
			{
				StoreID: store1ID,
				Name:    "Store 1",
				ThumbnailFile: &entity.File{
					FileID:    file1ID,
					FileName:  "thumb1.jpg",
					ObjectKey: objectKey1,
				},
			},
			{
				StoreID: store2ID,
				Name:    "Store 2",
				ThumbnailFile: &entity.File{
					FileID:    file2ID,
					FileName:  "thumb2.jpg",
					ObjectKey: objectKey2,
				},
			},
		},
	}

	// Configure storage to fail for the first key but succeed for the second
	mockStorage := &testutil.MockStorageProvider{
		ErrorsByKey: map[string]error{
			objectKey1: errors.New("storage error for key1"),
		},
		SignedURLsByKey: map[string]string{
			objectKey2: "https://example.com/signed-thumb2.jpg",
		},
	}

	h := handlers.NewStoreHandler(mockUC, mockStorage, "test-bucket")

	err := h.GetStores(c)
	// The request should succeed despite partial storage failures
	if err != nil {
		t.Fatalf("unexpected error: %v - partial storage failures should not cause request failure", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Parse the response
	var response []presenter.StoreResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if len(response) != 2 {
		t.Fatalf("expected 2 stores, got %d", len(response))
	}

	// Find the stores by ID
	var store1Resp, store2Resp *presenter.StoreResponse
	for i := range response {
		if response[i].StoreID == store1ID {
			store1Resp = &response[i]
		}
		if response[i].StoreID == store2ID {
			store2Resp = &response[i]
		}
	}

	// Store 1: signing failed, so URL should be nil
	if store1Resp == nil {
		t.Fatal("expected store 1 to be in response")
	}
	if store1Resp.ThumbnailFile == nil {
		t.Fatal("expected store 1 to have thumbnail_file")
	}
	if store1Resp.ThumbnailFile.URL != nil {
		t.Errorf("expected store 1 thumbnail URL to be nil (signing failed), got %v", *store1Resp.ThumbnailFile.URL)
	}

	// Store 2: signing succeeded, so URL should be set
	if store2Resp == nil {
		t.Fatal("expected store 2 to be in response")
	}
	if store2Resp.ThumbnailFile == nil {
		t.Fatal("expected store 2 to have thumbnail_file")
	}
	if store2Resp.ThumbnailFile.URL == nil {
		t.Error("expected store 2 thumbnail URL to be set (signing succeeded)")
	} else if *store2Resp.ThumbnailFile.URL != "https://example.com/signed-thumb2.jpg" {
		t.Errorf("expected store 2 thumbnail URL to be 'https://example.com/signed-thumb2.jpg', got %s", *store2Resp.ThumbnailFile.URL)
	}
}

// TestGetStoreByID_StorageEdgeCases verifies graceful handling when the storage
// provider returns nil results or empty URLs.
func TestGetStoreByID_StorageEdgeCases(t *testing.T) {
	tests := []struct {
		name           string
		returnNil      bool
		returnEmptyURL bool
		description    string
	}{
		{
			name:           "StorageReturnsNil",
			returnNil:      true,
			returnEmptyURL: false,
			description:    "nil storage result should be handled gracefully",
		},
		{
			name:           "StorageReturnsEmptyURL",
			returnNil:      false,
			returnEmptyURL: true,
			description:    "empty URL result should be handled gracefully",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			storeID := uuid.New().String()
			fileID := uuid.New().String()
			objectKey := "stores/thumbnail.jpg"

			req := httptest.NewRequest(http.MethodGet, "/stores/"+storeID, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetPath("/stores/:id")
			c.SetParamNames("id")
			c.SetParamValues(storeID)

			mockUC := &testutil.MockStoreUseCase{
				Store: &entity.Store{
					StoreID: storeID,
					Name:    "Test Store",
					ThumbnailFile: &entity.File{
						FileID:    fileID,
						FileName:  "thumbnail.jpg",
						ObjectKey: objectKey,
					},
				},
			}

			mockStorage := &testutil.MockStorageProvider{
				ReturnNil:      tt.returnNil,
				ReturnEmptyURL: tt.returnEmptyURL,
			}

			h := handlers.NewStoreHandler(mockUC, mockStorage, "test-bucket")

			err := h.GetStoreByID(c)
			if err != nil {
				t.Fatalf("unexpected error: %v - %s", err, tt.description)
			}
			if rec.Code != http.StatusOK {
				t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
			}

			var response presenter.StoreResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
				t.Fatalf("failed to unmarshal response: %v", err)
			}

			if response.StoreID != storeID {
				t.Errorf("expected store_id %s, got %s", storeID, response.StoreID)
			}

			if response.ThumbnailFile == nil {
				t.Fatal("expected thumbnail_file to be present")
			}
			if response.ThumbnailFile.URL != nil {
				t.Errorf("expected URL to be nil, got %v", *response.ThumbnailFile.URL)
			}
		})
	}
}

// TestGetStores_StorageSigningError_AllFail verifies that when storage signing
// fails for all stores, the request still succeeds with all URLs unset.
func TestGetStores_StorageSigningError_AllFail(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/stores", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	store1ID := uuid.New().String()
	store2ID := uuid.New().String()

	mockUC := &testutil.MockStoreUseCase{
		Stores: []entity.Store{
			{
				StoreID: store1ID,
				Name:    "Store 1",
				ThumbnailFile: &entity.File{
					FileID:    uuid.New().String(),
					FileName:  "thumb1.jpg",
					ObjectKey: "stores/thumb1.jpg",
				},
			},
			{
				StoreID: store2ID,
				Name:    "Store 2",
				ThumbnailFile: &entity.File{
					FileID:    uuid.New().String(),
					FileName:  "thumb2.jpg",
					ObjectKey: "stores/thumb2.jpg",
				},
			},
		},
	}

	// Configure storage to return an error for all keys
	mockStorage := &testutil.MockStorageProvider{
		CreateSignedDownloadErr: errors.New("storage service completely unavailable"),
	}

	h := handlers.NewStoreHandler(mockUC, mockStorage, "test-bucket")

	err := h.GetStores(c)
	// The request should succeed even though all signing failed
	if err != nil {
		t.Fatalf("unexpected error: %v - total storage failure should not cause request failure", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}

	// Parse the response
	var response []presenter.StoreResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if len(response) != 2 {
		t.Fatalf("expected 2 stores, got %d", len(response))
	}

	// Verify all URLs are nil
	for _, store := range response {
		if store.ThumbnailFile != nil && store.ThumbnailFile.URL != nil {
			t.Errorf("expected store %s thumbnail URL to be nil, got %v", store.StoreID, *store.ThumbnailFile.URL)
		}
	}
}

// TestGetStoreByID_StorageSigningTracksRequestedKeys verifies that the mock
// correctly tracks which keys were requested from the storage provider.
func TestGetStoreByID_StorageSigningTracksRequestedKeys(t *testing.T) {
	e := echo.New()
	storeID := uuid.New().String()
	fileID := uuid.New().String()
	objectKey := "stores/specific-thumbnail.jpg"

	req := httptest.NewRequest(http.MethodGet, "/stores/"+storeID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/stores/:id")
	c.SetParamNames("id")
	c.SetParamValues(storeID)

	mockUC := &testutil.MockStoreUseCase{
		Store: &entity.Store{
			StoreID: storeID,
			Name:    "Test Store",
			ThumbnailFile: &entity.File{
				FileID:    fileID,
				FileName:  "specific-thumbnail.jpg",
				ObjectKey: objectKey,
			},
		},
	}

	// Use a storage mock that tracks requested keys
	mockStorage := &testutil.MockStorageProvider{
		SignedURLsByKey: map[string]string{
			objectKey: "https://example.com/signed-specific-thumbnail.jpg",
		},
	}

	h := handlers.NewStoreHandler(mockUC, mockStorage, "test-bucket")

	err := h.GetStoreByID(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the correct key was requested
	if len(mockStorage.RequestedKeys) == 0 {
		t.Fatal("expected at least one key to be requested from storage")
	}

	found := false
	for _, key := range mockStorage.RequestedKeys {
		if key == objectKey {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected object key %q to be requested, but got: %v", objectKey, mockStorage.RequestedKeys)
	}
}
