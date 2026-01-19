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

// setupFavoriteTest creates common test dependencies
func setupFavoriteTest(t *testing.T) (output.FavoriteRepository, output.UserRepository, output.StoreRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	favRepo := repository.NewFavoriteRepository(db)
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return favRepo, userRepo, storeRepo
}

// createTestUserAndStore creates common test entities
func createTestUserAndStore(t *testing.T, userRepo output.UserRepository, storeRepo output.StoreRepository) (*entity.User, *entity.Store) {
	t.Helper()

	user := &entity.User{
		UserID:    "test-user-" + uuid.New().String()[:8],
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := &entity.Store{
		StoreID:   "test-store-" + uuid.New().String()[:8],
		Name:      "Test Store",
		Address:   "Test Address",
		Latitude:  35.6812,
		Longitude: 139.7671,
		PlaceID:   "test-place-id-" + uuid.New().String()[:8],
		Category:  "カフェ・喫茶",
		Budget:    "$$",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	require.NoError(t, storeRepo.Create(context.Background(), store))

	return user, store
}

// newTestUserID generates a unique user ID for testing
func newTestUserID(t *testing.T) string {
	t.Helper()
	return "user-" + uuid.New().String()[:8]
}

// newTestStoreID generates a unique store ID for testing
func newTestStoreID(t *testing.T) string {
	t.Helper()
	return "store-" + uuid.New().String()[:8]
}

func TestFavoriteRepository_Create_Success(t *testing.T) {
	favRepo, userRepo, storeRepo := setupFavoriteTest(t)

	// Create user and store using helper
	user, store := createTestUserAndStore(t, userRepo, storeRepo)

	// Create favorite
	favorite := &entity.Favorite{
		UserID:  user.UserID,
		StoreID: store.StoreID,
	}

	err := favRepo.Create(context.Background(), favorite)
	require.NoError(t, err)
}

func TestFavoriteRepository_FindByUserID_Success(t *testing.T) {
	favRepo, userRepo, storeRepo := setupFavoriteTest(t)

	// Create user
	user := &entity.User{
		UserID:    newTestUserID(t),
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create two stores with unique IDs
	store1 := &entity.Store{
		StoreID:   newTestStoreID(t),
		Name:      "Store 1",
		Address:   "Address 1",
		PlaceID:   "place-" + uuid.New().String()[:8],
		Latitude:  35.6812,
		Longitude: 139.7671,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	store2 := &entity.Store{
		StoreID:   newTestStoreID(t),
		Name:      "Store 2",
		Address:   "Address 2",
		PlaceID:   "place-" + uuid.New().String()[:8],
		Latitude:  35.6813,
		Longitude: 139.7672,
		Category:  "カフェ・喫茶",
		Budget:    "$$",
	}
	require.NoError(t, storeRepo.Create(context.Background(), store1))
	require.NoError(t, storeRepo.Create(context.Background(), store2))

	// Create favorites
	favorite1 := &entity.Favorite{UserID: user.UserID, StoreID: store1.StoreID}
	favorite2 := &entity.Favorite{UserID: user.UserID, StoreID: store2.StoreID}
	require.NoError(t, favRepo.Create(context.Background(), favorite1))
	require.NoError(t, favRepo.Create(context.Background(), favorite2))

	// Find by user ID
	favorites, err := favRepo.FindByUserID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Len(t, favorites, 2)
}

func TestFavoriteRepository_FindByUserID_Empty(t *testing.T) {
	favRepo, _, _ := setupFavoriteTest(t)

	nonexistentUserID := newTestUserID(t)
	favorites, err := favRepo.FindByUserID(context.Background(), nonexistentUserID)
	require.NoError(t, err)
	require.Empty(t, favorites)
}

func TestFavoriteRepository_FindByUserAndStore_Success(t *testing.T) {
	favRepo, userRepo, storeRepo := setupFavoriteTest(t)

	// Create user and store using helper
	user, store := createTestUserAndStore(t, userRepo, storeRepo)

	// Create favorite
	favorite := &entity.Favorite{UserID: user.UserID, StoreID: store.StoreID}
	require.NoError(t, favRepo.Create(context.Background(), favorite))

	// Find by user and store
	found, err := favRepo.FindByUserAndStore(context.Background(), user.UserID, store.StoreID)
	require.NoError(t, err)
	require.Equal(t, user.UserID, found.UserID)
	require.Equal(t, store.StoreID, found.StoreID)
}

func TestFavoriteRepository_FindByUserAndStore_NotFound(t *testing.T) {
	favRepo, _, _ := setupFavoriteTest(t)

	nonexistentUserID := newTestUserID(t)
	nonexistentStoreID := newTestStoreID(t)
	_, err := favRepo.FindByUserAndStore(context.Background(), nonexistentUserID, nonexistentStoreID)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

func TestFavoriteRepository_Delete_Success(t *testing.T) {
	favRepo, userRepo, storeRepo := setupFavoriteTest(t)

	// Create user and store using helper
	user, store := createTestUserAndStore(t, userRepo, storeRepo)

	// Create favorite
	favorite := &entity.Favorite{UserID: user.UserID, StoreID: store.StoreID}
	require.NoError(t, favRepo.Create(context.Background(), favorite))

	// Delete favorite
	err := favRepo.Delete(context.Background(), user.UserID, store.StoreID)
	require.NoError(t, err)

	// Verify deletion
	_, err = favRepo.FindByUserAndStore(context.Background(), user.UserID, store.StoreID)
	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound after deletion, got %v", err)
}
