package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type mockAdminStoreRepo struct {
	pending   []domain.Store
	store     *domain.Store
	findErr   error
	updateErr error
}

func (m *mockAdminStoreRepo) FindAll(ctx context.Context) ([]domain.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockAdminStoreRepo) FindByID(ctx context.Context, id int64) (*domain.Store, error) {
	if m.findErr != nil {
		return nil, m.findErr
	}
	if m.store == nil {
		return nil, apperr.New(apperr.CodeNotFound, domain.ErrNotFound)
	}
	return m.store, nil
}

func (m *mockAdminStoreRepo) FindPending(ctx context.Context) ([]domain.Store, error) {
	return append([]domain.Store(nil), m.pending...), nil
}

func (m *mockAdminStoreRepo) Create(ctx context.Context, store *domain.Store) error {
	return errors.New("not implemented")
}

func (m *mockAdminStoreRepo) Update(ctx context.Context, store *domain.Store) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	m.store = store
	return nil
}

func (m *mockAdminStoreRepo) Delete(ctx context.Context, id int64) error {
	return errors.New("not implemented")
}

func TestGetPendingStores(t *testing.T) {
	repo := &mockAdminStoreRepo{
		pending: []domain.Store{
			{StoreID: 1, Name: "A"},
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
	repo := &mockAdminStoreRepo{findErr: apperr.New(apperr.CodeNotFound, domain.ErrNotFound)}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.ApproveStore(context.Background(), 1); !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Fatalf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestApproveStore_Success(t *testing.T) {
	store := &domain.Store{StoreID: 1, IsApproved: false}
	repo := &mockAdminStoreRepo{store: store}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.ApproveStore(context.Background(), 1); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.store.IsApproved {
		t.Fatalf("expected store to be approved")
	}
}

func TestRejectStore_SetsApprovalFalse(t *testing.T) {
	store := &domain.Store{StoreID: 2, IsApproved: true}
	repo := &mockAdminStoreRepo{store: store}
	uc := usecase.NewAdminUseCase(repo)
	if err := uc.RejectStore(context.Background(), 2); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.store.IsApproved {
		t.Fatalf("expected store to be rejected")
	}
}
