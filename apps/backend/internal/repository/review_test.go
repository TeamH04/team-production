package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupReviewTest creates common test dependencies for review tests
func setupReviewTest(t *testing.T) (*gorm.DB, output.ReviewRepository, output.UserRepository, output.StoreRepository, output.FileRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	reviewRepo := repository.NewReviewRepository(db)
	userRepo := repository.NewUserRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	fileRepo := repository.NewFileRepository(db)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return db, reviewRepo, userRepo, storeRepo, fileRepo
}

// newTestReviewUser creates a test user for review tests
func newTestReviewUser(t *testing.T) *entity.User {
	t.Helper()
	return &entity.User{
		UserID:    "user-" + uuid.New().String()[:8],
		Email:     "test-" + uuid.New().String()[:8] + "@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// newTestReviewStore creates a test store for review tests
func newTestReviewStore(t *testing.T) *entity.Store {
	t.Helper()
	return &entity.Store{
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
}

// newTestFile creates a test file for review tests
func newTestFile(t *testing.T, createdBy string) *entity.File {
	t.Helper()
	size := int64(1024)
	contentType := "image/jpeg"
	return &entity.File{
		FileID:      "file-" + uuid.New().String()[:8],
		FileKind:    "review_image",
		FileName:    "test.jpg",
		FileSize:    &size,
		ObjectKey:   "uploads/test-" + uuid.New().String()[:8] + ".jpg",
		ContentType: &contentType,
		IsDeleted:   false,
		CreatedBy:   &createdBy,
	}
}

// insertReviewDirectly inserts a review directly into the database
func insertReviewDirectly(t *testing.T, db *gorm.DB, reviewID, storeID, userID string, rating int, content string) {
	t.Helper()
	err := db.Exec(
		"INSERT INTO reviews (review_id, store_id, user_id, rating, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
		reviewID, storeID, userID, rating, content, time.Now(),
	).Error
	require.NoError(t, err)
}

// insertReviewLikeDirectly inserts a review like directly into the database
func insertReviewLikeDirectly(t *testing.T, db *gorm.DB, reviewID, userID string) {
	t.Helper()
	err := db.Exec(
		"INSERT INTO review_likes (review_id, user_id, created_at) VALUES (?, ?, ?)",
		reviewID, userID, time.Now(),
	).Error
	require.NoError(t, err)
}

// TestReviewRepository_FindByID_Success tests finding a review by ID
func TestReviewRepository_FindByID_Success(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create user and store
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert review directly
	reviewID := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID, store.StoreID, user.UserID, 5, "Great place!")

	// Find by ID
	found, err := reviewRepo.FindByID(context.Background(), reviewID)
	require.NoError(t, err)
	require.Equal(t, reviewID, found.ReviewID)
	require.Equal(t, store.StoreID, found.StoreID)
	require.Equal(t, user.UserID, found.UserID)
	require.Equal(t, 5, found.Rating)
}

// TestReviewRepository_FindByID_NotFound tests finding a non-existent review
func TestReviewRepository_FindByID_NotFound(t *testing.T) {
	_, reviewRepo, _, _, _ := setupReviewTest(t)

	nonexistentID := "review-" + uuid.New().String()[:8]
	_, err := reviewRepo.FindByID(context.Background(), nonexistentID)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

// TestReviewRepository_FindByStoreID_Success tests finding reviews by store ID
func TestReviewRepository_FindByStoreID_Success(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create users and store
	user1 := newTestReviewUser(t)
	user2 := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user1))
	require.NoError(t, userRepo.Create(context.Background(), user2))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert reviews directly
	reviewID1 := "review-" + uuid.New().String()[:8]
	reviewID2 := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID1, store.StoreID, user1.UserID, 4, "Good place!")
	insertReviewDirectly(t, db, reviewID2, store.StoreID, user2.UserID, 5, "Great service!")

	// Find by store ID with default sort (created_at desc)
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Len(t, reviews, 2)
}

// TestReviewRepository_FindByStoreID_Empty tests finding reviews for a store with no reviews
func TestReviewRepository_FindByStoreID_Empty(t *testing.T) {
	_, reviewRepo, _, storeRepo, _ := setupReviewTest(t)

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Empty(t, reviews)
}

// TestReviewRepository_FindByStoreID_SortByLiked tests finding reviews sorted by likes
func TestReviewRepository_FindByStoreID_SortByLiked(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create users and store
	user1 := newTestReviewUser(t)
	user2 := newTestReviewUser(t)
	user3 := newTestReviewUser(t) // liker
	require.NoError(t, userRepo.Create(context.Background(), user1))
	require.NoError(t, userRepo.Create(context.Background(), user2))
	require.NoError(t, userRepo.Create(context.Background(), user3))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert reviews directly
	review1ID := "review-" + uuid.New().String()[:8]
	review2ID := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, review1ID, store.StoreID, user1.UserID, 4, "Less popular review")
	insertReviewDirectly(t, db, review2ID, store.StoreID, user2.UserID, 5, "More popular review")

	// Add like to review2 (making it more popular)
	insertReviewLikeDirectly(t, db, review2ID, user3.UserID)

	// Find by store ID sorted by likes
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "liked", "")
	require.NoError(t, err)
	require.Len(t, reviews, 2)
	// The more popular review should come first
	require.Equal(t, review2ID, reviews[0].ReviewID)
	require.Equal(t, review1ID, reviews[1].ReviewID)
}

// TestReviewRepository_FindByStoreID_WithViewerID tests finding reviews with viewer's like status
func TestReviewRepository_FindByStoreID_WithViewerID(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create users and store
	user1 := newTestReviewUser(t)
	viewer := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user1))
	require.NoError(t, userRepo.Create(context.Background(), viewer))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert review directly
	reviewID := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID, store.StoreID, user1.UserID, 5, "Great place!")

	// Add like from viewer
	insertReviewLikeDirectly(t, db, reviewID, viewer.UserID)

	// Find by store ID with viewer ID
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", viewer.UserID)
	require.NoError(t, err)
	require.Len(t, reviews, 1)
	require.True(t, reviews[0].LikedByMe)
	require.Equal(t, 1, reviews[0].LikesCount)
}

// TestReviewRepository_FindByUserID_Success tests finding reviews by user ID
func TestReviewRepository_FindByUserID_Success(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create user and stores
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store1 := newTestReviewStore(t)
	store2 := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store1))
	require.NoError(t, storeRepo.Create(context.Background(), store2))

	// Insert reviews directly
	reviewID1 := "review-" + uuid.New().String()[:8]
	reviewID2 := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID1, store1.StoreID, user.UserID, 4, "Great cafe!")
	insertReviewDirectly(t, db, reviewID2, store2.StoreID, user.UserID, 5, "Nice restaurant!")

	// Find by user ID
	reviews, err := reviewRepo.FindByUserID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Len(t, reviews, 2)
}

// TestReviewRepository_FindByUserID_Empty tests finding reviews for a user with no reviews
func TestReviewRepository_FindByUserID_Empty(t *testing.T) {
	_, reviewRepo, userRepo, _, _ := setupReviewTest(t)

	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	reviews, err := reviewRepo.FindByUserID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Empty(t, reviews)
}

// TestReviewRepository_CreateInTx_Success tests creating a review in a transaction
func TestReviewRepository_CreateInTx_Success(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create user and store
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create review in transaction
	tx := repository.NewGormTransaction(db)
	content := "Excellent food!"

	err := tx.StartTransaction(func(txDB interface{}) error {
		return reviewRepo.CreateInTx(context.Background(), txDB, output.CreateReview{
			StoreID: store.StoreID,
			UserID:  user.UserID,
			Rating:  5,
			Content: &content,
		})
	})
	require.NoError(t, err)

	// Verify review was created
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Len(t, reviews, 1)
	require.Equal(t, 5, reviews[0].Rating)
	require.Equal(t, content, *reviews[0].Content)
}

// TestReviewRepository_CreateInTx_WithMenus tests creating a review with menus
func TestReviewRepository_CreateInTx_WithMenus(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create user and store
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create menus directly in DB with known IDs
	menuID1 := "menu-" + uuid.New().String()[:8]
	menuID2 := "menu-" + uuid.New().String()[:8]
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID1, store.StoreID, "Menu 1", time.Now()).Error)
	require.NoError(t, db.Exec("INSERT INTO menus (menu_id, store_id, name, created_at) VALUES (?, ?, ?, ?)",
		menuID2, store.StoreID, "Menu 2", time.Now()).Error)

	// Create review with menus in transaction
	tx := repository.NewGormTransaction(db)
	content := "Loved the food!"

	err := tx.StartTransaction(func(txDB interface{}) error {
		return reviewRepo.CreateInTx(context.Background(), txDB, output.CreateReview{
			StoreID: store.StoreID,
			UserID:  user.UserID,
			Rating:  5,
			Content: &content,
			MenuIDs: []string{menuID1, menuID2},
		})
	})
	require.NoError(t, err)

	// Verify review was created with menus
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Len(t, reviews, 1)
	require.Len(t, reviews[0].Menus, 2)
}

// TestReviewRepository_CreateInTx_WithFiles tests creating a review with files
func TestReviewRepository_CreateInTx_WithFiles(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, fileRepo := setupReviewTest(t)

	// Create user and store
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create files
	file1 := newTestFile(t, user.UserID)
	file2 := newTestFile(t, user.UserID)
	require.NoError(t, fileRepo.Create(context.Background(), file1))
	require.NoError(t, fileRepo.Create(context.Background(), file2))

	// Create review with files in transaction
	tx := repository.NewGormTransaction(db)
	content := "Check out these photos!"

	err := tx.StartTransaction(func(txDB interface{}) error {
		return reviewRepo.CreateInTx(context.Background(), txDB, output.CreateReview{
			StoreID: store.StoreID,
			UserID:  user.UserID,
			Rating:  5,
			Content: &content,
			FileIDs: []string{file1.FileID, file2.FileID},
		})
	})
	require.NoError(t, err)

	// Verify review was created with files
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Len(t, reviews, 1)
	require.Len(t, reviews[0].Files, 2)
}

// TestReviewRepository_CreateInTx_InvalidTransaction tests creating a review with invalid transaction
func TestReviewRepository_CreateInTx_InvalidTransaction(t *testing.T) {
	_, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create user and store
	user := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Try to create review with invalid transaction (not *gorm.DB)
	content := "Test content"
	err := reviewRepo.CreateInTx(context.Background(), "invalid", output.CreateReview{
		StoreID: store.StoreID,
		UserID:  user.UserID,
		Rating:  5,
		Content: &content,
	})

	require.Error(t, err)
	require.Equal(t, output.ErrInvalidTransaction, err)
}

// TestReviewRepository_AddLike_Success tests adding a like to a review
func TestReviewRepository_AddLike_Success(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create users and store
	user1 := newTestReviewUser(t)
	user2 := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user1))
	require.NoError(t, userRepo.Create(context.Background(), user2))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert review directly
	reviewID := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID, store.StoreID, user1.UserID, 5, "Great place!")

	// Add like
	err := reviewRepo.AddLike(context.Background(), reviewID, user2.UserID)
	require.NoError(t, err)

	// Verify like was added
	reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
	require.NoError(t, err)
	require.Len(t, reviews, 1)
	require.Equal(t, 1, reviews[0].LikesCount)
}

// TestReviewRepository_LikeOperations tests like add/remove operations with table-driven tests
func TestReviewRepository_LikeOperations(t *testing.T) {
	tests := []struct {
		name          string
		operation     string // "add_idempotent" or "remove"
		expectedLikes int
	}{
		{
			name:          "AddLike_Idempotent",
			operation:     "add_idempotent",
			expectedLikes: 1,
		},
		{
			name:          "RemoveLike_Success",
			operation:     "remove",
			expectedLikes: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

			// Create users and store
			user1 := newTestReviewUser(t)
			user2 := newTestReviewUser(t)
			require.NoError(t, userRepo.Create(context.Background(), user1))
			require.NoError(t, userRepo.Create(context.Background(), user2))

			store := newTestReviewStore(t)
			require.NoError(t, storeRepo.Create(context.Background(), store))

			// Insert review directly
			reviewID := "review-" + uuid.New().String()[:8]
			insertReviewDirectly(t, db, reviewID, store.StoreID, user1.UserID, 5, "Great place!")

			// Add like first
			err := reviewRepo.AddLike(context.Background(), reviewID, user2.UserID)
			require.NoError(t, err)

			// Execute operation based on test case
			switch tt.operation {
			case "add_idempotent":
				// Add like again - should not error (OnConflict DoNothing)
				err = reviewRepo.AddLike(context.Background(), reviewID, user2.UserID)
				require.NoError(t, err)
			case "remove":
				// Remove like
				err = reviewRepo.RemoveLike(context.Background(), reviewID, user2.UserID)
				require.NoError(t, err)
			}

			// Verify likes count
			reviews, err := reviewRepo.FindByStoreID(context.Background(), store.StoreID, "", "")
			require.NoError(t, err)
			require.Len(t, reviews, 1)
			require.Equal(t, tt.expectedLikes, reviews[0].LikesCount)
		})
	}
}

// TestReviewRepository_RemoveLike_NonexistentLike tests removing a non-existent like (idempotent)
func TestReviewRepository_RemoveLike_NonexistentLike(t *testing.T) {
	db, reviewRepo, userRepo, storeRepo, _ := setupReviewTest(t)

	// Create users and store
	user1 := newTestReviewUser(t)
	user2 := newTestReviewUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user1))
	require.NoError(t, userRepo.Create(context.Background(), user2))

	store := newTestReviewStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Insert review directly
	reviewID := "review-" + uuid.New().String()[:8]
	insertReviewDirectly(t, db, reviewID, store.StoreID, user1.UserID, 5, "Great place!")

	// Try to remove non-existent like - should not error
	err := reviewRepo.RemoveLike(context.Background(), reviewID, user2.UserID)
	require.NoError(t, err)
}
