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

func TestFavoriteRepository_Create_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	// Create user and store first
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := userRepo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

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
	if err := storeRepo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Create favorite
	favoriteRepo := repository.NewFavoriteRepository(db)
	favorite := &entity.Favorite{
		UserID:  "user-123",
		StoreID: "store-123",
	}

	err := favoriteRepo.Create(context.Background(), favorite)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestFavoriteRepository_FindByUserID_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	// Create user and stores
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := userRepo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

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
	if err := storeRepo.Create(context.Background(), store1); err != nil {
		t.Fatalf("failed to create store1: %v", err)
	}
	if err := storeRepo.Create(context.Background(), store2); err != nil {
		t.Fatalf("failed to create store2: %v", err)
	}

	// Create favorites
	favorite1 := &entity.Favorite{UserID: "user-123", StoreID: "store-1"}
	favorite2 := &entity.Favorite{UserID: "user-123", StoreID: "store-2"}
	if err := favoriteRepo.Create(context.Background(), favorite1); err != nil {
		t.Fatalf("failed to create favorite1: %v", err)
	}
	if err := favoriteRepo.Create(context.Background(), favorite2); err != nil {
		t.Fatalf("failed to create favorite2: %v", err)
	}

	// Find by user ID
	favorites, err := favoriteRepo.FindByUserID(context.Background(), "user-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(favorites) != 2 {
		t.Errorf("expected 2 favorites, got %d", len(favorites))
	}
}

func TestFavoriteRepository_FindByUserID_Empty(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	favoriteRepo := repository.NewFavoriteRepository(db)

	favorites, err := favoriteRepo.FindByUserID(context.Background(), "nonexistent")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(favorites) != 0 {
		t.Errorf("expected 0 favorites, got %d", len(favorites))
	}
}

func TestFavoriteRepository_FindByUserAndStore_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	// Create user and store
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := userRepo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

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
	if err := storeRepo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Create favorite
	favorite := &entity.Favorite{UserID: "user-123", StoreID: "store-123"}
	if err := favoriteRepo.Create(context.Background(), favorite); err != nil {
		t.Fatalf("failed to create favorite: %v", err)
	}

	// Find by user and store
	found, err := favoriteRepo.FindByUserAndStore(context.Background(), "user-123", "store-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %s", found.UserID)
	}
	if found.StoreID != "store-123" {
		t.Errorf("expected StoreID store-123, got %s", found.StoreID)
	}
}

func TestFavoriteRepository_FindByUserAndStore_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	favoriteRepo := repository.NewFavoriteRepository(db)

	_, err := favoriteRepo.FindByUserAndStore(context.Background(), "user-123", "store-123")

	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound error, got %v", err)
	}
}

func TestFavoriteRepository_Delete_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	// Create user and store
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	favoriteRepo := repository.NewFavoriteRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := userRepo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

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
	if err := storeRepo.Create(context.Background(), store); err != nil {
		t.Fatalf("failed to create store: %v", err)
	}

	// Create favorite
	favorite := &entity.Favorite{UserID: "user-123", StoreID: "store-123"}
	if err := favoriteRepo.Create(context.Background(), favorite); err != nil {
		t.Fatalf("failed to create favorite: %v", err)
	}

	// Delete favorite
	err := favoriteRepo.Delete(context.Background(), "user-123", "store-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify deletion
	_, err = favoriteRepo.FindByUserAndStore(context.Background(), "user-123", "store-123")
	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound after deletion, got %v", err)
	}
}
