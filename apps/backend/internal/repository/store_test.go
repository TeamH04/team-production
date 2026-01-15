package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
)

func TestStoreRepository_Create_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	store := &entity.Store{
		StoreID:   "store-123",
		Name:      "Test Store",
		Address:   "Test Address",
		PlaceID:   "place-123",
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}

	err := repo.Create(context.Background(), store)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if store.StoreID == "" {
		t.Error("expected StoreID to be set")
	}
}

func TestStoreRepository_FindAll_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	// Create some stores
	store1 := &entity.Store{
		StoreID:   "store-1",
		Name:      "Store 1",
		Address:   "Address 1",
		PlaceID:   "place-1",
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	store2 := &entity.Store{
		StoreID:   "store-2",
		Name:      "Store 2",
		Address:   "Address 2",
		PlaceID:   "place-2",
		Latitude:  35.6813,
		Longitude: 139.7672,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	if err := repo.Create(context.Background(), store1); err != nil {
		t.Fatalf("failed to create store1: %v", err)
	}
	if err := repo.Create(context.Background(), store2); err != nil {
		t.Fatalf("failed to create store2: %v", err)
	}

	// Find all stores
	stores, err := repo.FindAll(context.Background())

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 2 {
		t.Errorf("expected 2 stores, got %d", len(stores))
	}
}

func TestStoreRepository_FindAll_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	stores, err := repo.FindAll(context.Background())

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 0 {
		t.Errorf("expected 0 stores, got %d", len(stores))
	}
}

func TestStoreRepository_FindByID_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	// Create a store
	store := &entity.Store{
		StoreID:   "store-123",
		Name:      "Test Store",
		Address:   "Test Address",
		PlaceID:   "place-123",
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	if err := repo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Find by ID
	found, err := repo.FindByID(context.Background(), "store-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found.StoreID != "store-123" {
		t.Errorf("expected StoreID store-123, got %s", found.StoreID)
	}
	if found.Name != "Test Store" {
		t.Errorf("expected Name Test Store, got %s", found.Name)
	}
}

func TestStoreRepository_FindByID_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	_, err := repo.FindByID(context.Background(), "nonexistent")

	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound error, got %v", err)
	}
}

func TestStoreRepository_FindPending_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	// Create approved and pending stores
	approvedStore := &entity.Store{
		StoreID:    "store-approved",
		Name:       "Approved Store",
		Address:    "Address 1",
		PlaceID:    "place-1",
		Latitude:   35.6812,
		Longitude:  139.7671,
		IsApproved: true,
		Category:   "カフェ・喫茶",
		Budget:     "$$",
	}
	pendingStore := &entity.Store{
		StoreID:    "store-pending",
		Name:       "Pending Store",
		Address:    "Address 2",
		PlaceID:    "place-2",
		Latitude:   35.6813,
		Longitude:  139.7672,
		IsApproved: false,
		Category:   "カフェ・喫茶",
		Budget:     "$$",
	}
	if err := repo.Create(context.Background(), approvedStore); err != nil {
		t.Fatalf("failed to create approved store: %v", err)
	}
	if err := repo.Create(context.Background(), pendingStore); err != nil {
		t.Fatalf("failed to create pending store: %v", err)
	}

	// Find pending stores
	stores, err := repo.FindPending(context.Background())

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(stores) != 1 {
		t.Errorf("expected 1 pending store, got %d", len(stores))
	}
	if len(stores) > 0 && stores[0].StoreID != "store-pending" {
		t.Errorf("expected pending store, got %s", stores[0].StoreID)
	}
}

func TestStoreRepository_Update_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	// Create a store
	store := &entity.Store{
		StoreID:   "store-123",
		Name:      "Original Name",
		Address:   "Test Address",
		PlaceID:   "place-123",
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	if err := repo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Update the store
	store.Name = "Updated Name"
	store.UpdatedAt = time.Now()
	err := repo.Update(context.Background(), store)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the update
	found, err := repo.FindByID(context.Background(), "store-123")
	if err != nil {
		t.Fatalf("failed to find store: %v", err)
	}
	if found.Name != "Updated Name" {
		t.Errorf("expected Name Updated Name, got %s", found.Name)
	}
}

func TestStoreRepository_Delete_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewStoreRepository(db)

	// Create a store
	store := &entity.Store{
		StoreID:   "store-123",
		Name:      "Test Store",
		Address:   "Test Address",
		PlaceID:   "place-123",
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	if err := repo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Delete the store
	err := repo.Delete(context.Background(), "store-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the deletion
	_, err = repo.FindByID(context.Background(), "store-123")
	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound after deletion, got %v", err)
	}
}
