package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupFileTest creates common test dependencies for file tests
func setupFileTest(t *testing.T) (output.FileRepository, output.StoreRepository, output.UserRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	fileRepo := repository.NewFileRepository(db)
	storeRepo := repository.NewStoreRepository(db)
	userRepo := repository.NewUserRepository(db)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return fileRepo, storeRepo, userRepo
}

// newTestFileStore creates a test store for file tests
func newTestFileStore(t *testing.T) *entity.Store {
	t.Helper()
	return &entity.Store{
		StoreID:   "store-" + uuid.New().String()[:8],
		Name:      "Test Store for File",
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

// newTestFileUser creates a test user for file tests
func newTestFileUser(t *testing.T) *entity.User {
	t.Helper()
	return &entity.User{
		UserID:    "user-" + uuid.New().String()[:8],
		Email:     "test-" + uuid.New().String()[:8] + "@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// newTestFileEntity creates a test file entity
func newTestFileEntity(t *testing.T, createdBy *string, overrides ...func(*entity.File)) *entity.File {
	t.Helper()
	size := int64(1024)
	contentType := "image/jpeg"
	file := &entity.File{
		FileID:      "file-" + uuid.New().String()[:8],
		FileKind:    "store_image",
		FileName:    "test-" + uuid.New().String()[:8] + ".jpg",
		FileSize:    &size,
		ObjectKey:   "uploads/" + uuid.New().String() + ".jpg",
		ContentType: &contentType,
		IsDeleted:   false,
		CreatedBy:   createdBy,
	}
	for _, fn := range overrides {
		fn(file)
	}
	return file
}

// TestFileRepository_Create_Success tests creating a file
func TestFileRepository_Create_Success(t *testing.T) {
	fileRepo, _, userRepo := setupFileTest(t)

	// Create user
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create file
	file := newTestFileEntity(t, &user.UserID)
	err := fileRepo.Create(context.Background(), file)
	require.NoError(t, err)
	require.NotEmpty(t, file.FileID)
	require.NotZero(t, file.CreatedAt)
}

// TestFileRepository_Create_WithNilCreatedBy tests creating a file without created_by
func TestFileRepository_Create_WithNilCreatedBy(t *testing.T) {
	fileRepo, _, _ := setupFileTest(t)

	// Create file without created_by
	file := newTestFileEntity(t, nil)
	err := fileRepo.Create(context.Background(), file)
	require.NoError(t, err)
	require.NotEmpty(t, file.FileID)
}

// TestFileRepository_Create_WithNilFileSize tests creating a file without file size
func TestFileRepository_Create_WithNilFileSize(t *testing.T) {
	fileRepo, _, userRepo := setupFileTest(t)

	// Create user
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create file without size
	file := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileSize = nil
	})
	err := fileRepo.Create(context.Background(), file)
	require.NoError(t, err)
}

// TestFileRepository_LinkToStore_Success tests linking a file to a store
func TestFileRepository_LinkToStore_Success(t *testing.T) {
	fileRepo, storeRepo, userRepo := setupFileTest(t)

	// Create user and store
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create file
	file := newTestFileEntity(t, &user.UserID)
	require.NoError(t, fileRepo.Create(context.Background(), file))

	// Link file to store
	err := fileRepo.LinkToStore(context.Background(), store.StoreID, file.FileID)
	require.NoError(t, err)
}

// TestFileRepository_FindByStoreAndIDs_Success tests finding files by store and IDs
func TestFileRepository_FindByStoreAndIDs_Success(t *testing.T) {
	fileRepo, storeRepo, userRepo := setupFileTest(t)

	// Create user and store
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create files
	file1 := newTestFileEntity(t, &user.UserID)
	file2 := newTestFileEntity(t, &user.UserID)
	require.NoError(t, fileRepo.Create(context.Background(), file1))
	require.NoError(t, fileRepo.Create(context.Background(), file2))

	// Link files to store
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file1.FileID))
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file2.FileID))

	// Find by store and IDs
	files, err := fileRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{file1.FileID, file2.FileID})
	require.NoError(t, err)
	require.Len(t, files, 2)
}

// TestFileRepository_FindByStoreAndIDs_EmptyIDs tests finding files with empty ID list
func TestFileRepository_FindByStoreAndIDs_EmptyIDs(t *testing.T) {
	fileRepo, storeRepo, _ := setupFileTest(t)

	// Create store
	store := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Find with empty IDs - should return nil without error
	files, err := fileRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{})
	require.NoError(t, err)
	require.Nil(t, files)
}

// TestFileRepository_FindByStoreAndIDs_NotLinkedToStore tests finding files not linked to the store
func TestFileRepository_FindByStoreAndIDs_NotLinkedToStore(t *testing.T) {
	fileRepo, storeRepo, userRepo := setupFileTest(t)

	// Create user and stores
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store1 := newTestFileStore(t)
	store2 := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store1))
	require.NoError(t, storeRepo.Create(context.Background(), store2))

	// Create file and link to store1
	file := newTestFileEntity(t, &user.UserID)
	require.NoError(t, fileRepo.Create(context.Background(), file))
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store1.StoreID, file.FileID))

	// Try to find file using store2's ID - should not find it
	files, err := fileRepo.FindByStoreAndIDs(context.Background(), store2.StoreID, []string{file.FileID})
	require.NoError(t, err)
	require.Empty(t, files)
}

// TestFileRepository_FindByStoreAndIDs_PartialMatch tests finding files with partial match
func TestFileRepository_FindByStoreAndIDs_PartialMatch(t *testing.T) {
	fileRepo, storeRepo, userRepo := setupFileTest(t)

	// Create user and store
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create file and link to store
	file := newTestFileEntity(t, &user.UserID)
	require.NoError(t, fileRepo.Create(context.Background(), file))
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file.FileID))

	nonexistentID := "file-" + uuid.New().String()[:8]

	// Find with mix of existing and non-existing IDs
	files, err := fileRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{file.FileID, nonexistentID})
	require.NoError(t, err)
	require.Len(t, files, 1)
	require.Equal(t, file.FileID, files[0].FileID)
}

// TestFileRepository_FindByStoreAndIDs_MultipleFilesLinked tests finding multiple files linked to the same store
func TestFileRepository_FindByStoreAndIDs_MultipleFilesLinked(t *testing.T) {
	fileRepo, storeRepo, userRepo := setupFileTest(t)

	// Create user and store
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	store := newTestFileStore(t)
	require.NoError(t, storeRepo.Create(context.Background(), store))

	// Create multiple files
	file1 := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileName = "file1.jpg"
	})
	file2 := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileName = "file2.jpg"
	})
	file3 := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileName = "file3.jpg"
	})
	require.NoError(t, fileRepo.Create(context.Background(), file1))
	require.NoError(t, fileRepo.Create(context.Background(), file2))
	require.NoError(t, fileRepo.Create(context.Background(), file3))

	// Link all files to store
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file1.FileID))
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file2.FileID))
	require.NoError(t, fileRepo.LinkToStore(context.Background(), store.StoreID, file3.FileID))

	// Find only file1 and file3
	files, err := fileRepo.FindByStoreAndIDs(context.Background(), store.StoreID, []string{file1.FileID, file3.FileID})
	require.NoError(t, err)
	require.Len(t, files, 2)
}

// TestFileRepository_Create_DifferentFileKinds tests creating files with different kinds
func TestFileRepository_Create_DifferentFileKinds(t *testing.T) {
	fileRepo, _, userRepo := setupFileTest(t)

	// Create user
	user := newTestFileUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create file with review_image kind
	reviewFile := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileKind = "review_image"
	})
	err := fileRepo.Create(context.Background(), reviewFile)
	require.NoError(t, err)

	// Create file with thumbnail kind
	thumbnailFile := newTestFileEntity(t, &user.UserID, func(f *entity.File) {
		f.FileKind = "thumbnail"
	})
	err = fileRepo.Create(context.Background(), thumbnailFile)
	require.NoError(t, err)
}
