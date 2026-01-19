package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

const (
	testFileID  = "file-1"
	testNewName = "New Name"
)

// --- GetAllStores Tests ---

func TestGetAllStores_Success(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Store 1"},
			{StoreID: "store-2", Name: "Store 2"},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	stores, err := uc.GetAllStores(context.Background())
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if len(stores) != 2 {
		t.Errorf("expected 2 stores, got %d", len(stores))
	}
}

func TestGetAllStores_Empty(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	stores, err := uc.GetAllStores(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(stores) != 0 {
		t.Errorf("expected 0 stores, got %d", len(stores))
	}
}

func TestGetAllStores_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	mockRepo := &testutil.MockStoreRepository{
		FindAllErr: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetAllStores(context.Background())

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- GetStoreByID Tests ---

func TestGetStoreByID_Success(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", Address: "Test Address"},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	store, err := uc.GetStoreByID(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.StoreID != "store-1" {
		t.Errorf("expected StoreID store-1, got %s", store.StoreID)
	}
	if store.Name != "Test Store" {
		t.Errorf("expected Name 'Test Store', got %s", store.Name)
	}
}

func TestGetStoreByID_NotFound(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetStoreByID(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestGetStoreByID_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetStoreByID(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- CreateStore Tests ---

func TestCreateStore_Success(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:            "Test Store",
		Address:         "Test Address",
		ThumbnailFileID: testutil.StringPtr(testFileID),
		Latitude:        35.6812,
		Longitude:       139.7671,
		PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
	}

	store, err := uc.CreateStore(context.Background(), req)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if store.Name != req.Name {
		t.Errorf("expected name %s, got %s", req.Name, store.Name)
	}

	if store.StoreID == "" {
		t.Error("expected store ID to be set")
	}
}

func TestCreateStore_InvalidInput(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{}
	uc := usecase.NewStoreUseCase(mockRepo)

	tests := []struct {
		name  string
		input input.CreateStoreInput
		want  error
	}{
		{
			name: "empty name",
			input: input.CreateStoreInput{
				Address:   "Test Address",
				Latitude:  35.6812,
				Longitude: 139.7671,
				PlaceID:   "ChIJRUjlH92OAGAR6otTD3tUcrg",
			},
			want: usecase.ErrInvalidInput,
		},
		{
			name: "missing thumbnail",
			input: input.CreateStoreInput{
				Name:      "Test Store",
				Address:   "Test Address",
				Latitude:  35.6812,
				Longitude: 139.7671,
				PlaceID:   "ChIJRUjlH92OAGAR6otTD3tUcrg",
			},
			want: usecase.ErrInvalidInput,
		},
		{
			name: "invalid coordinates",
			input: func() input.CreateStoreInput {
				return input.CreateStoreInput{
					Name:            "Test Store",
					Address:         "Test Address",
					ThumbnailFileID: testutil.StringPtr(testFileID),
					Latitude:        91.0, // Invalid: latitude must be between -90 and 90
					Longitude:       139.7671,
					PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
				}
			}(),
			want: usecase.ErrInvalidCoordinates,
		},
		{
			name: "empty place id",
			input: func() input.CreateStoreInput {
				return input.CreateStoreInput{
					Name:            "Test Store",
					Address:         "Test Address",
					ThumbnailFileID: testutil.StringPtr(testFileID),
					Latitude:        35.6812,
					Longitude:       139.7671,
					PlaceID:         "",
				}
			}(),
			want: usecase.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := uc.CreateStore(context.Background(), tt.input)
			if !errors.Is(err, tt.want) {
				t.Errorf("expected error %v, got %v", tt.want, err)
			}
		})
	}
}

func TestCreateStore_RepositoryError(t *testing.T) {
	createErr := errors.New("create error")
	mockRepo := &testutil.MockStoreRepository{
		CreateErr: createErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:            "Test Store",
		Address:         "Test Address",
		ThumbnailFileID: testutil.StringPtr(testFileID),
		Latitude:        35.6812,
		Longitude:       139.7671,
		PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
	}

	_, err := uc.CreateStore(context.Background(), req)

	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

// --- UpdateStore Tests ---

func TestUpdateStore_Success(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Old Name", Address: "Old Address", PlaceID: "place-1"},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := testNewName
	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name: &newName,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.Name != newName {
		t.Errorf("expected Name '%s', got '%s'", newName, store.Name)
	}
}

func TestUpdateStore_PartialUpdate(t *testing.T) {
	originalAddress := "Original Address"
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Original Name", Address: originalAddress, PlaceID: "place-1", Latitude: 35.0, Longitude: 139.0},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newLat := 36.0
	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Latitude: &newLat,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.Name != "Original Name" {
		t.Errorf("expected Name to remain 'Original Name', got '%s'", store.Name)
	}
	if store.Latitude != newLat {
		t.Errorf("expected Latitude %f, got %f", newLat, store.Latitude)
	}
}

func TestUpdateStore_NotFound(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := testNewName
	_, err := uc.UpdateStore(context.Background(), "nonexistent", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestUpdateStore_EmptyPlaceID(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", PlaceID: "original-place-id"},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	emptyPlaceID := ""
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		PlaceID: &emptyPlaceID,
	})

	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got %v", err)
	}
}

func TestUpdateStore_UpdateError(t *testing.T) {
	updateErr := errors.New("update failed")
	mockRepo := &testutil.MockStoreRepository{
		Stores:    []entity.Store{{StoreID: "store-1", Name: "Test", PlaceID: "place-1"}},
		UpdateErr: updateErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := testNewName
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}

func TestUpdateStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := testNewName
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- DeleteStore Tests ---

func TestDeleteStore_Success(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{{StoreID: "store-1", Name: "Test Store"}},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteStore_NotFound(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestDeleteStore_DeleteError(t *testing.T) {
	deleteErr := errors.New("delete failed")
	mockRepo := &testutil.MockStoreRepository{
		Stores:    []entity.Store{{StoreID: "store-1", Name: "Test Store"}},
		DeleteErr: deleteErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")

	if !errors.Is(err, deleteErr) {
		t.Errorf("expected delete error, got %v", err)
	}
}

func TestDeleteStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	mockRepo := &testutil.MockStoreRepository{
		FindByIDErr: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- Additional Coordinate Validation Tests ---

func TestCreateStore_InvalidLongitude(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{}
	uc := usecase.NewStoreUseCase(mockRepo)

	tests := []struct {
		name      string
		longitude float64
	}{
		{"longitude too high", 181.0},
		{"longitude too low", -181.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := input.CreateStoreInput{
				Name:            "Test Store",
				Address:         "Test Address",
				ThumbnailFileID: testutil.StringPtr(testFileID),
				Latitude:        35.6812,
				Longitude:       tt.longitude,
				PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
			}

			_, err := uc.CreateStore(context.Background(), req)
			if !errors.Is(err, usecase.ErrInvalidCoordinates) {
				t.Errorf("expected ErrInvalidCoordinates for longitude %f, got %v", tt.longitude, err)
			}
		})
	}
}

func TestCreateStore_InvalidLatitude(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{}
	uc := usecase.NewStoreUseCase(mockRepo)

	tests := []struct {
		name     string
		latitude float64
	}{
		{"latitude too high", 91.0},
		{"latitude too low", -91.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := input.CreateStoreInput{
				Name:            "Test Store",
				Address:         "Test Address",
				ThumbnailFileID: testutil.StringPtr(testFileID),
				Latitude:        tt.latitude,
				Longitude:       139.7671,
				PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
			}

			_, err := uc.CreateStore(context.Background(), req)
			if !errors.Is(err, usecase.ErrInvalidCoordinates) {
				t.Errorf("expected ErrInvalidCoordinates for latitude %f, got %v", tt.latitude, err)
			}
		})
	}
}

func TestCreateStore_EmptyAddress(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{}
	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:            "Test Store",
		Address:         "",
		ThumbnailFileID: testutil.StringPtr(testFileID),
		Latitude:        35.6812,
		Longitude:       139.7671,
		PlaceID:         "ChIJRUjlH92OAGAR6otTD3tUcrg",
	}

	_, err := uc.CreateStore(context.Background(), req)
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput for empty address, got %v", err)
	}
}

// --- UpdateStore Validation Tests ---

func TestUpdateStore_InvalidLatitude(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", PlaceID: "place-1"},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	invalidLat := 91.0
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Latitude: &invalidLat,
	})

	if !errors.Is(err, usecase.ErrInvalidCoordinates) {
		t.Errorf("expected ErrInvalidCoordinates, got %v", err)
	}
}

func TestUpdateStore_InvalidLongitude(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", PlaceID: "place-1"},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	invalidLng := 181.0
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Longitude: &invalidLng,
	})

	if !errors.Is(err, usecase.ErrInvalidCoordinates) {
		t.Errorf("expected ErrInvalidCoordinates, got %v", err)
	}
}

// --- UpdateStore All Fields Tests ---

func TestUpdateStore_AllBasicFields(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Old Name", Address: "Old Address", PlaceID: "old-place-id", Latitude: 35.0, Longitude: 139.0},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	newName := "New Name"
	newAddress := "New Address"
	newPlaceID := "new-place-id"
	newLat := 36.0
	newLng := 140.0

	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name:      &newName,
		Address:   &newAddress,
		PlaceID:   &newPlaceID,
		Latitude:  &newLat,
		Longitude: &newLng,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.Name != newName {
		t.Errorf("expected Name %s, got %s", newName, store.Name)
	}
	if store.Address != newAddress {
		t.Errorf("expected Address %s, got %s", newAddress, store.Address)
	}
	if store.PlaceID != newPlaceID {
		t.Errorf("expected PlaceID %s, got %s", newPlaceID, store.PlaceID)
	}
	if store.Latitude != newLat {
		t.Errorf("expected Latitude %f, got %f", newLat, store.Latitude)
	}
	if store.Longitude != newLng {
		t.Errorf("expected Longitude %f, got %f", newLng, store.Longitude)
	}
}

func TestUpdateStore_AllOptionalFields(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", PlaceID: "place-1"},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	newThumbnail := "new-thumbnail-id"
	newOpenedAt := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	newDescription := "New Description"
	newOpeningHours := "9:00-21:00"
	newGoogleMapURL := "https://maps.google.com/test"

	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		ThumbnailFileID: &newThumbnail,
		OpenedAt:        &newOpenedAt,
		Description:     &newDescription,
		OpeningHours:    &newOpeningHours,
		GoogleMapURL:    &newGoogleMapURL,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.ThumbnailFileID == nil || *store.ThumbnailFileID != newThumbnail {
		t.Errorf("expected ThumbnailFileID %s, got %v", newThumbnail, store.ThumbnailFileID)
	}
	if store.OpenedAt == nil || !store.OpenedAt.Equal(newOpenedAt) {
		t.Errorf("expected OpenedAt %v, got %v", newOpenedAt, store.OpenedAt)
	}
	if store.Description == nil || *store.Description != newDescription {
		t.Errorf("expected Description %s, got %v", newDescription, store.Description)
	}
	if store.OpeningHours == nil || *store.OpeningHours != newOpeningHours {
		t.Errorf("expected OpeningHours %s, got %v", newOpeningHours, store.OpeningHours)
	}
	if store.GoogleMapURL == nil || *store.GoogleMapURL != newGoogleMapURL {
		t.Errorf("expected GoogleMapURL %s, got %v", newGoogleMapURL, store.GoogleMapURL)
	}
}

func TestUpdateStore_OnlyAddress(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", Address: "Old Address", PlaceID: "place-1"},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	newAddress := "Updated Address"
	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Address: &newAddress,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.Address != newAddress {
		t.Errorf("expected Address %s, got %s", newAddress, store.Address)
	}
	if store.Name != "Test Store" {
		t.Errorf("expected Name to remain 'Test Store', got %s", store.Name)
	}
}

func TestUpdateStore_OnlyLongitude(t *testing.T) {
	mockRepo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Test Store", PlaceID: "place-1", Latitude: 35.0, Longitude: 139.0},
		},
	}
	uc := usecase.NewStoreUseCase(mockRepo)

	newLng := 140.0
	store, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Longitude: &newLng,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.Longitude != newLng {
		t.Errorf("expected Longitude %f, got %f", newLng, store.Longitude)
	}
	if store.Latitude != 35.0 {
		t.Errorf("expected Latitude to remain 35.0, got %f", store.Latitude)
	}
}
