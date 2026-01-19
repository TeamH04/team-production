package repository_test

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
)

// setupTransactionTest creates common test dependencies for transaction tests
func setupTransactionTest(t *testing.T) *gorm.DB {
	t.Helper()
	db := testutil.SetupTestDB(t)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return db
}

// TestGormTransaction_StartTransaction_Success tests successful transaction commit
func TestGormTransaction_StartTransaction_Success(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)

	userID := "user-" + uuid.New().String()[:8]

	// Execute transaction that creates a user
	err := tx.StartTransaction(func(txDB interface{}) error {
		gormTx, ok := txDB.(*gorm.DB)
		if !ok {
			return errors.New("invalid transaction type")
		}
		return gormTx.Exec("INSERT INTO users (user_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			userID, "Test User", "test@example.com", "user", time.Now(), time.Now()).Error
	})
	require.NoError(t, err)

	// Verify the user was created
	var count int64
	err = db.Table("users").Where("user_id = ?", userID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), count)
}

// TestGormTransaction_StartTransaction_Rollback tests transaction rollback on error
func TestGormTransaction_StartTransaction_Rollback(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)

	userID := "user-" + uuid.New().String()[:8]
	expectedErr := errors.New("intentional error for rollback")

	// Execute transaction that creates a user then returns error
	err := tx.StartTransaction(func(txDB interface{}) error {
		gormTx, ok := txDB.(*gorm.DB)
		if !ok {
			return errors.New("invalid transaction type")
		}
		// Insert user
		if err := gormTx.Exec("INSERT INTO users (user_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			userID, "Test User", "test@example.com", "user", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		// Return error to trigger rollback
		return expectedErr
	})
	require.Error(t, err)
	require.Equal(t, expectedErr, err)

	// Verify the user was NOT created (rolled back)
	var count int64
	err = db.Table("users").Where("user_id = ?", userID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(0), count)
}

// TestGormTransaction_StartTransaction_MultipleOperations tests multiple operations in a transaction
func TestGormTransaction_StartTransaction_MultipleOperations(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)

	userID := "user-" + uuid.New().String()[:8]
	storeID := "store-" + uuid.New().String()[:8]
	placeID := "place-" + uuid.New().String()[:8]

	// Execute transaction with multiple operations
	err := tx.StartTransaction(func(txDB interface{}) error {
		gormTx, ok := txDB.(*gorm.DB)
		if !ok {
			return errors.New("invalid transaction type")
		}
		// Create user
		if err := gormTx.Exec("INSERT INTO users (user_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			userID, "Test User", "test@example.com", "user", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		// Create store
		if err := gormTx.Exec("INSERT INTO stores (store_id, name, address, latitude, longitude, place_id, category, budget, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			storeID, "Test Store", "Test Address", 35.6812, 139.7671, placeID, "カフェ・喫茶", "$$", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		return nil
	})
	require.NoError(t, err)

	// Verify both were created
	var userCount, storeCount int64
	err = db.Table("users").Where("user_id = ?", userID).Count(&userCount).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), userCount)

	err = db.Table("stores").Where("store_id = ?", storeID).Count(&storeCount).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), storeCount)
}

// TestGormTransaction_StartTransaction_MultipleOperationsRollback tests rollback with multiple operations
func TestGormTransaction_StartTransaction_MultipleOperationsRollback(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)

	userID := "user-" + uuid.New().String()[:8]
	storeID := "store-" + uuid.New().String()[:8]
	placeID := "place-" + uuid.New().String()[:8]
	expectedErr := errors.New("intentional error after multiple inserts")

	// Execute transaction with multiple operations then error
	err := tx.StartTransaction(func(txDB interface{}) error {
		gormTx, ok := txDB.(*gorm.DB)
		if !ok {
			return errors.New("invalid transaction type")
		}
		// Create user
		if err := gormTx.Exec("INSERT INTO users (user_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			userID, "Test User", "test@example.com", "user", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		// Create store
		if err := gormTx.Exec("INSERT INTO stores (store_id, name, address, latitude, longitude, place_id, category, budget, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			storeID, "Test Store", "Test Address", 35.6812, 139.7671, placeID, "カフェ・喫茶", "$$", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		// Return error after both inserts
		return expectedErr
	})
	require.Error(t, err)
	require.Equal(t, expectedErr, err)

	// Verify both were rolled back
	var userCount, storeCount int64
	err = db.Table("users").Where("user_id = ?", userID).Count(&userCount).Error
	require.NoError(t, err)
	require.Equal(t, int64(0), userCount)

	err = db.Table("stores").Where("store_id = ?", storeID).Count(&storeCount).Error
	require.NoError(t, err)
	require.Equal(t, int64(0), storeCount)
}

// TestGormTransaction_StartTransaction_NestedError tests error in nested function
func TestGormTransaction_StartTransaction_NestedError(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)

	userID := "user-" + uuid.New().String()[:8]
	nestedErr := errors.New("nested error")

	innerFunc := func(_ *gorm.DB) error {
		return nestedErr
	}

	// Execute transaction that calls inner function returning error
	err := tx.StartTransaction(func(txDB interface{}) error {
		gormTx, ok := txDB.(*gorm.DB)
		if !ok {
			return errors.New("invalid transaction type")
		}
		// Create user first
		if err := gormTx.Exec("INSERT INTO users (user_id, name, email, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
			userID, "Test User", "test@example.com", "user", time.Now(), time.Now()).Error; err != nil {
			return err
		}
		// Call inner function that returns error
		return innerFunc(gormTx)
	})
	require.Error(t, err)
	require.Equal(t, nestedErr, err)

	// Verify user was rolled back
	var count int64
	err = db.Table("users").Where("user_id = ?", userID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(0), count)
}

// TestNewGormTransaction tests creating a new transaction
func TestNewGormTransaction(t *testing.T) {
	db := setupTransactionTest(t)

	tx := repository.NewGormTransaction(db)
	require.NotNil(t, tx)
}
