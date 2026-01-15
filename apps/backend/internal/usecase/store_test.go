package usecase_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// モックリポジトリの実装
type mockStoreRepository struct {
	stores      []entity.Store
	createError error
	findError   error
	updateError error
	deleteError error
}

func (m *mockStoreRepository) FindAll(ctx context.Context) ([]entity.Store, error) {
	if m.findError != nil {
		return nil, m.findError
	}
	return m.stores, nil
}

func (m *mockStoreRepository) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.findError != nil {
		return nil, m.findError
	}
	for i := range m.stores {
		if m.stores[i].StoreID == id {
			return &m.stores[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *mockStoreRepository) Create(ctx context.Context, store *entity.Store) error {
	if m.createError != nil {
		return m.createError
	}
	store.StoreID = fmt.Sprintf("store-%d", len(m.stores)+1)
	m.stores = append(m.stores, *store)
	return nil
}

func (m *mockStoreRepository) Update(ctx context.Context, store *entity.Store) error {
	if m.updateError != nil {
		return m.updateError
	}
	for i := range m.stores {
		if m.stores[i].StoreID == store.StoreID {
			m.stores[i] = *store
			return nil
		}
	}
	return nil
}

func (m *mockStoreRepository) Delete(ctx context.Context, id string) error {
	if m.deleteError != nil {
		return m.deleteError
	}
	return nil
}

func (m *mockStoreRepository) FindPending(ctx context.Context) ([]entity.Store, error) {
	return nil, nil
}

// --- GetAllStores Tests ---

func TestGetAllStores_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{
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
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
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
	mockRepo := &mockStoreRepository{
		findError: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetAllStores(context.Background())

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- GetStoreByID Tests ---

func TestGetStoreByID_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{
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
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetStoreByID(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestGetStoreByID_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	mockRepo := &mockStoreRepository{
		findError: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	_, err := uc.GetStoreByID(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- CreateStore Tests ---

func TestCreateStore_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:    "Test Store",
		Address: "Test Address",
		ThumbnailFileID: func() *string {
			id := "file-1"
			return &id
		}(),
		Latitude:  35.6812,
		Longitude: 139.7671,
		PlaceID:   "ChIJRUjlH92OAGAR6otTD3tUcrg",
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
	mockRepo := &mockStoreRepository{}
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
					Name:    "Test Store",
					Address: "Test Address",
					ThumbnailFileID: func() *string {
						id := "file-1"
						return &id
					}(),
					Latitude:  0,
					Longitude: 0,
					PlaceID:   "ChIJRUjlH92OAGAR6otTD3tUcrg",
				}
			}(),
			want: usecase.ErrInvalidCoordinates,
		},
		{
			name: "empty place id",
			input: func() input.CreateStoreInput {
				return input.CreateStoreInput{
					Name:    "Test Store",
					Address: "Test Address",
					ThumbnailFileID: func() *string {
						id := "file-1"
						return &id
					}(),
					Latitude:  35.6812,
					Longitude: 139.7671,
					PlaceID:   "",
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
	mockRepo := &mockStoreRepository{
		createError: createErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:    "Test Store",
		Address: "Test Address",
		ThumbnailFileID: func() *string {
			id := "file-1"
			return &id
		}(),
		Latitude:  35.6812,
		Longitude: 139.7671,
		PlaceID:   "ChIJRUjlH92OAGAR6otTD3tUcrg",
	}

	_, err := uc.CreateStore(context.Background(), req)

	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

// --- UpdateStore Tests ---

func TestUpdateStore_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{
			{StoreID: "store-1", Name: "Old Name", Address: "Old Address", PlaceID: "place-1"},
		},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := "New Name"
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
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{
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
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := "New Name"
	_, err := uc.UpdateStore(context.Background(), "nonexistent", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestUpdateStore_EmptyPlaceID(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{
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
	mockRepo := &mockStoreRepository{
		stores:      []entity.Store{{StoreID: "store-1", Name: "Test", PlaceID: "place-1"}},
		updateError: updateErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := "New Name"
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}

func TestUpdateStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	mockRepo := &mockStoreRepository{
		findError: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	newName := "New Name"
	_, err := uc.UpdateStore(context.Background(), "store-1", input.UpdateStoreInput{
		Name: &newName,
	})

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- DeleteStore Tests ---

func TestDeleteStore_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{{StoreID: "store-1", Name: "Test Store"}},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteStore_NotFound(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestDeleteStore_DeleteError(t *testing.T) {
	deleteErr := errors.New("delete failed")
	mockRepo := &mockStoreRepository{
		stores:      []entity.Store{{StoreID: "store-1", Name: "Test Store"}},
		deleteError: deleteErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")

	if !errors.Is(err, deleteErr) {
		t.Errorf("expected delete error, got %v", err)
	}
}

func TestDeleteStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	mockRepo := &mockStoreRepository{
		findError: dbErr,
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	err := uc.DeleteStore(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}
