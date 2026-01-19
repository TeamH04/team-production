package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupStoreTest creates common test dependencies for store tests
func setupStoreTest(t *testing.T) output.StoreRepository {
	t.Helper()
	db := testutil.SetupTestDB(t)
	repo := repository.NewStoreRepository(db)
	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})
	return repo
}

// newTestStore creates a test store with unique IDs and optional overrides
func newTestStore(t *testing.T, overrides ...func(*entity.Store)) *entity.Store {
	t.Helper()
	store := &entity.Store{
		StoreID:   "store-" + uuid.New().String()[:8],
		Name:      "Test Store",
		Address:   "Test Address",
		Latitude:  35.6812,
		Longitude: 139.7671,
		PlaceID:   "place-" + uuid.New().String()[:8],
		Category:  "カフェ・喫茶",
		Budget:    "$$",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	for _, fn := range overrides {
		fn(store)
	}
	return store
}

func TestStoreRepository_Create_Success(t *testing.T) {
	repo := setupStoreTest(t)

	store := newTestStore(t)

	err := repo.Create(context.Background(), store)
	require.NoError(t, err)
	require.NotEmpty(t, store.StoreID)
}

func TestStoreRepository_FindAll_Success(t *testing.T) {
	repo := setupStoreTest(t)

	// Create some stores with unique IDs
	store1 := newTestStore(t, func(s *entity.Store) {
		s.Name = "Store 1"
		s.Address = "Address 1"
	})
	store2 := newTestStore(t, func(s *entity.Store) {
		s.Name = "Store 2"
		s.Address = "Address 2"
		s.Latitude = 35.6813
		s.Longitude = 139.7672
	})
	require.NoError(t, repo.Create(context.Background(), store1))
	require.NoError(t, repo.Create(context.Background(), store2))

	// Find all stores
	stores, err := repo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, stores, 2)
}

func TestStoreRepository_FindAll_Empty(t *testing.T) {
	repo := setupStoreTest(t)

	stores, err := repo.FindAll(context.Background())
	require.NoError(t, err)
	require.Empty(t, stores)
}

func TestStoreRepository_FindByID_Success(t *testing.T) {
	repo := setupStoreTest(t)

	// Create a store
	store := newTestStore(t)
	require.NoError(t, repo.Create(context.Background(), store))

	// Find by ID
	found, err := repo.FindByID(context.Background(), store.StoreID)
	require.NoError(t, err)
	require.Equal(t, store.StoreID, found.StoreID)
	require.Equal(t, store.Name, found.Name)
}

func TestStoreRepository_FindByID_NotFound(t *testing.T) {
	repo := setupStoreTest(t)

	nonexistentID := "store-" + uuid.New().String()[:8]
	_, err := repo.FindByID(context.Background(), nonexistentID)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

func TestStoreRepository_FindPending_Success(t *testing.T) {
	repo := setupStoreTest(t)

	// Create approved and pending stores with unique IDs
	approvedStore := newTestStore(t, func(s *entity.Store) {
		s.Name = "Approved Store"
		s.IsApproved = true
	})
	pendingStore := newTestStore(t, func(s *entity.Store) {
		s.Name = "Pending Store"
		s.IsApproved = false
	})
	require.NoError(t, repo.Create(context.Background(), approvedStore))
	require.NoError(t, repo.Create(context.Background(), pendingStore))

	// Find pending stores
	stores, err := repo.FindPending(context.Background())
	require.NoError(t, err)
	require.Len(t, stores, 1)
	require.Equal(t, pendingStore.StoreID, stores[0].StoreID)
}

func TestStoreRepository_Update_Success(t *testing.T) {
	repo := setupStoreTest(t)

	// Create a store
	store := newTestStore(t, func(s *entity.Store) {
		s.Name = "Original Name"
	})
	require.NoError(t, repo.Create(context.Background(), store))

	// Update the store
	store.Name = "Updated Name"
	store.UpdatedAt = time.Now()
	err := repo.Update(context.Background(), store)
	require.NoError(t, err)

	// Verify the update
	found, err := repo.FindByID(context.Background(), store.StoreID)
	require.NoError(t, err)
	require.Equal(t, "Updated Name", found.Name)
}

func TestStoreRepository_Delete_Success(t *testing.T) {
	repo := setupStoreTest(t)

	// Create a store
	store := newTestStore(t)
	require.NoError(t, repo.Create(context.Background(), store))

	// Delete the store
	err := repo.Delete(context.Background(), store.StoreID)
	require.NoError(t, err)

	// Verify the deletion
	_, err = repo.FindByID(context.Background(), store.StoreID)
	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound after deletion, got %v", err)
}
