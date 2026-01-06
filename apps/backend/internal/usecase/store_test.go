package usecase_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// モックリポジトリの実装
type mockStoreRepository struct {
	stores      []entity.Store
	createError error
	findError   error
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
	for _, store := range m.stores {
		if store.StoreID == id {
			return &store, nil
		}
	}
	return nil, errors.New("not found")
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
	return nil
}

func (m *mockStoreRepository) Delete(ctx context.Context, id string) error {
	return nil
}

func (m *mockStoreRepository) FindPending(ctx context.Context) ([]entity.Store, error) {
	return nil, nil
}

// テストケース
func TestGetAllStores(t *testing.T) {
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

func TestCreateStore_Success(t *testing.T) {
	mockRepo := &mockStoreRepository{
		stores: []entity.Store{},
	}

	uc := usecase.NewStoreUseCase(mockRepo)

	req := input.CreateStoreInput{
		Name:    "Test Store",
		Address: "Test Address",
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
				Address: "Test Address",
			},
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
