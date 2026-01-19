package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// --- GetMenusByStoreID Tests ---

func TestGetMenusByStoreID_Success(t *testing.T) {
	menus := []entity.Menu{
		{MenuID: "menu-1", StoreID: "store-1", Name: "Menu 1"},
		{MenuID: "menu-2", StoreID: "store-1", Name: "Menu 2"},
	}
	menuRepo := &testutil.MockMenuRepository{FindByStoreIDResult: menus}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

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
	menuRepo := &testutil.MockMenuRepository{}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.GetMenusByStoreID(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestGetMenusByStoreID_EmptyMenus(t *testing.T) {
	menuRepo := &testutil.MockMenuRepository{FindByStoreIDResult: []entity.Menu{}}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

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
	menuRepo := &testutil.MockMenuRepository{FindByStoreIDErr: dbErr}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.GetMenusByStoreID(context.Background(), "store-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- CreateMenu Tests ---

func TestCreateMenu_Success(t *testing.T) {
	menuRepo := &testutil.MockMenuRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

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
	menuRepo := &testutil.MockMenuRepository{}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
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
	menuRepo := &testutil.MockMenuRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name: "",
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got %v", err)
	}
}

func TestCreateMenu_WithOptionalFields(t *testing.T) {
	menuRepo := &testutil.MockMenuRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

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
	menuRepo := &testutil.MockMenuRepository{CreateErr: createErr}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMenuUseCase(menuRepo, storeRepo)

	_, err := uc.CreateMenu(context.Background(), "store-1", input.CreateMenuInput{
		Name: "New Menu",
	})
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}
