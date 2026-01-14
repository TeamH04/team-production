package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type mockAdminStoreRepo struct {
	pending   []entity.Store
	store     *entity.Store
	findErr   error
	updateErr error
}

func (m *mockAdminStoreRepo) FindAll(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockAdminStoreRepo) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}
	if m.store == nil {
		return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	}
	return m.store, nil
}

func (m *mockAdminStoreRepo) FindPending(ctx context.Context) ([]entity.Store, error) {
	return append([]entity.Store(nil), m.pending...), nil
}

func (m *mockAdminStoreRepo) Create(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockAdminStoreRepo) Update(ctx context.Context, store *entity.Store) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.store = store
	return nil
}

func (m *mockAdminStoreRepo) Delete(ctx context.Context, id string) error {
	return errors.New("not implemented")
}

func TestGetPendingStores(t *testing.T) {
	repo := &mockAdminStoreRepo{
		pending: []entity.Store{
			{StoreID: "store-1", Name: "A"},
		},
	}
	uc := usecase.NewAdminUseCase(repo)

	stores, err := uc.GetPendingStores(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 1 {
		t.Fatalf("expected 1 store, got %d", len(stores))
	}
}

func TestApproveStore_NotFound(t *testing.T) {
	repo := &mockAdminStoreRepo{findErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound)}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.ApproveStore(context.Background(), "store-1"); !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Fatalf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestApproveStore_Success(t *testing.T) {
	store := &entity.Store{StoreID: "store-1", IsApproved: false}
	repo := &mockAdminStoreRepo{store: store}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.ApproveStore(context.Background(), "store-1"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.store.IsApproved {
		t.Fatalf("expected store to be approved")
	}
}

func TestRejectStore_SetsApprovalFalse(t *testing.T) {
	store := &entity.Store{StoreID: "store-2", IsApproved: true}
	repo := &mockAdminStoreRepo{store: store}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.RejectStore(context.Background(), "store-2"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.store.IsApproved {
		t.Fatalf("expected store to be rejected")
	}
}
