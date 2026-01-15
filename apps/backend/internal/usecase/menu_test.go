package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// mockMenuRepository implements output.MenuRepository for testing
type mockMenuRepository struct {
	findByStoreIDResult []entity.Menu
	findByStoreIDErr    error
	createErr           error
}

func (m *mockMenuRepository) FindByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	if m.findByStoreIDErr != nil {
		return nil, m.findByStoreIDErr
	}
	return m.findByStoreIDResult, nil
}

func (m *mockMenuRepository) FindByStoreAndIDs(ctx context.Context, storeID string, menuIDs []string) ([]entity.Menu, error) {
	return nil, errors.New("not implemented")
}

func (m *mockMenuRepository) Create(ctx context.Context, menu *entity.Menu) error {
	return m.createErr
}

// mockStoreRepoForMenu implements output.StoreRepository for menu tests
type mockStoreRepoForMenu struct {
	findByIDResult *entity.Store
	findByIDErr    error
}

func (m *mockStoreRepoForMenu) FindAll(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForMenu) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockStoreRepoForMenu) FindPending(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForMenu) Create(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForMenu) Update(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForMenu) Delete(ctx context.Context, id string) error {
	return errors.New("not implemented")
}

// --- GetMenusByStoreID Tests ---

func TestGetMenusByStoreID_Success(t *testing.T) {
	menus := []entity.Menu{
		{MenuID: "menu-1", StoreID: "store-1", Name: "Menu 1"},
		{MenuID: "menu-2", StoreID: "store-1", Name: "Menu 2"},
	}
	menuRepo := &mockMenuRepository{findByStoreIDResult: menus}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	result, err := uc.GetMenusByStoreID(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 menus, got %d", len(result))
	}
}

func TestGetMenusByStoreID_StoreNotFound(t *testing.T) {
	menuRepo := &mockMenuRepository{}
	storeRepo := &mockStoreRepoForMenu{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.GetMenusByStoreID(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestGetMenusByStoreID_EmptyMenus(t *testing.T) {
	menuRepo := &mockMenuRepository{findByStoreIDResult: []entity.Menu{}}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	result, err := uc.GetMenusByStoreID(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected 0 menus, got %d", len(result))
	}
}

func TestGetMenusByStoreID_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	menuRepo := &mockMenuRepository{findByStoreIDErr: dbErr}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.GetMenusByStoreID(context.Background(), "store-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- CreateMenu Tests ---

func TestCreateMenu_Success(t *testing.T) {
	menuRepo := &mockMenuRepository{}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	result, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name: "New Menu",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "New Menu" {
		t.Errorf("expected Name 'New Menu', got %s", result.Name)
	}
	if result.StoreID != "store-1" {
		t.Errorf("expected StoreID 'store-1', got %s", result.StoreID)
	}
}

func TestCreateMenu_StoreNotFound(t *testing.T) {
	menuRepo := &mockMenuRepository{}
	storeRepo := &mockStoreRepoForMenu{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.CreateMenu(context.Background(), "nonexistent", input.CreateMenuInput{
		Name: "New Menu",
	})
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestCreateMenu_InvalidInput_EmptyName(t *testing.T) {
	menuRepo := &mockMenuRepository{}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name: "",
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got %v", err)
	}
}

func TestCreateMenu_WithOptionalFields(t *testing.T) {
	menuRepo := &mockMenuRepository{}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	price := 1000
	description := "A delicious menu item"
	result, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name:        "New Menu",
		Price:       &price,
		Description: &description,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Price == nil || *result.Price != price {
		t.Errorf("expected Price %d, got %v", price, result.Price)
	}
	if result.Description == nil || *result.Description != description {
		t.Errorf("expected Description %s, got %v", description, result.Description)
	}
}

func TestCreateMenu_CreateError(t *testing.T) {
	createErr := errors.New("create error")
	menuRepo := &mockMenuRepository{createErr: createErr}
	storeRepo := &mockStoreRepoForMenu{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name: "New Menu",
	})
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}
