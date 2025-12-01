package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// モックリポジトリの実装
type mockStoreRepository struct {
	stores      []domain.Store
	createError error
	findError   error
}

func (m *mockStoreRepository) FindAll(ctx context.Context) ([]domain.Store, error) {
	if m.findError != nil {
		return nil, m.findError
	}
	return m.stores, nil
}

func (m *mockStoreRepository) FindByID(ctx context.Context, id int64) (*domain.Store, error) {
	if m.findError != nil {
		return nil, m.findError
	}
	for _, store := range m.stores {
		if store.StoreID == id {
			return &store, nil
		}
	}
	return nil, errors.New("not found")
}

func (m *mockStoreRepository) Create(ctx context.Context, store *domain.Store) error {
	if m.createError != nil {
		return m.createError
	}
	store.StoreID = int64(len(m.stores) + 1)
	m.stores = append(m.stores, *store)
	return nil
}

func (m *mockStoreRepository) Update(ctx context.Context, store *domain.Store) error {
	return nil
}

func (m *mockStoreRepository) Delete(ctx context.Context, id int64) error {
	return nil
}

func (m *mockStoreRepository) FindPending(ctx context.Context) ([]domain.Store, error) {
	return nil, nil
}

// テストケース
func TestGetAllStores(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []domain.Store{
			{StoreID: 1, Name: "Store 1"},
			{StoreID: 2, Name: "Store 2"},
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

func TestCreateStore_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []domain.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	input := usecase.CreateStoreInput{
		Name:         "Test Store",
		Address:      "Test Address",
		ThumbnailURL: "https://example.com/image.jpg",
		Latitude:     35.6812,
		Longitude:    139.7671,
	}

	store, err := uc.CreateStore(context.Background(), input)

	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	if store.Name != input.Name {
		t.Errorf("expected name %s, got %s", input.Name, store.Name)
	}

	if store.StoreID == 0 {
		t.Error("expected store ID to be set")
	}
}

func TestCreateStore_InvalidInput(t *testing.T) {
	mockRepo := &mockStoreRepository{}
	uc := usecase.NewStoreUseCase(mockRepo)

	tests := []struct {
		name  string
		input usecase.CreateStoreInput
		want  error
	}{
		{
			name: "empty name",
			input: usecase.CreateStoreInput{
				Address:      "Test Address",
				ThumbnailURL: "https://example.com/image.jpg",
				Latitude:     35.6812,
				Longitude:    139.7671,
			},
			want: usecase.ErrInvalidInput,
		},
		{
			name: "invalid coordinates",
			input: usecase.CreateStoreInput{
				Name:         "Test Store",
				Address:      "Test Address",
				ThumbnailURL: "https://example.com/image.jpg",
				Latitude:     0,
				Longitude:    0,
			},
			want: usecase.ErrInvalidCoordinates,
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
