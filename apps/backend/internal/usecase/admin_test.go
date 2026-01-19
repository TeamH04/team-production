package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- GetPendingStores Tests ---

func TestGetPendingStores_Success(t *testing.T) {
	repo := &testutil.MockStoreRepository{
		Stores: []entity.Store{
			{StoreID: "store-1", Name: "Store A"},
			{StoreID: "store-2", Name: "Store B"},
		},
	}
	uc := usecase.NewAdminUseCase(repo)

	stores, err := uc.GetPendingStores(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 2 {
		t.Errorf("expected 2 stores, got %d", len(stores))
	}
}

func TestGetPendingStores_Empty(t *testing.T) {
	repo := &testutil.MockStoreRepository{
		Stores: []entity.Store{},
	}
	uc := usecase.NewAdminUseCase(repo)

	stores, err := uc.GetPendingStores(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 0 {
		t.Errorf("expected 0 stores, got %d", len(stores))
	}
}

func TestGetPendingStores_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	repo := &testutil.MockStoreRepository{
		FindPendingErr: dbErr,
	}
	uc := usecase.NewAdminUseCase(repo)

	_, err := uc.GetPendingStores(context.Background())

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- ApproveStore Tests ---

func TestApproveStore_Success(t *testing.T) {
	store := &entity.Store{StoreID: "store-1", IsApproved: false}
	repo := &testutil.MockStoreRepository{Store: store}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.ApproveStore(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.UpdateCalledWith.IsApproved {
		t.Fatalf("expected store to be approved")
	}
}

func TestApproveStore_NotFound(t *testing.T) {
	repo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.ApproveStore(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestApproveStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	repo := &testutil.MockStoreRepository{
		FindByIDErr: dbErr,
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.ApproveStore(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

func TestApproveStore_UpdateError(t *testing.T) {
	updateErr := errors.New("update failed")
	store := &entity.Store{StoreID: "store-1", IsApproved: false}
	repo := &testutil.MockStoreRepository{
		Store:     store,
		UpdateErr: updateErr,
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.ApproveStore(context.Background(), "store-1")

	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}

// --- RejectStore Tests ---

func TestRejectStore_Success(t *testing.T) {
	store := &entity.Store{StoreID: "store-1", IsApproved: true}
	repo := &testutil.MockStoreRepository{Store: store}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.RejectStore(context.Background(), "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.UpdateCalledWith.IsApproved {
		t.Fatalf("expected store to be rejected (IsApproved=false)")
	}
}

func TestRejectStore_NotFound(t *testing.T) {
	repo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.RejectStore(context.Background(), "nonexistent")

	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestRejectStore_FindByIDError(t *testing.T) {
	dbErr := errors.New("database connection error")
	repo := &testutil.MockStoreRepository{
		FindByIDErr: dbErr,
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.RejectStore(context.Background(), "store-1")

	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

func TestRejectStore_UpdateError(t *testing.T) {
	updateErr := errors.New("update failed")
	store := &entity.Store{StoreID: "store-1", IsApproved: true}
	repo := &testutil.MockStoreRepository{
		Store:     store,
		UpdateErr: updateErr,
	}
	uc := usecase.NewAdminUseCase(repo)

	err := uc.RejectStore(context.Background(), "store-1")

	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}
