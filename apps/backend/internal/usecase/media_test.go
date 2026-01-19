package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// --- CreateReviewUploads Tests ---

func TestCreateReviewUploads_Success(t *testing.T) {
	storage := &testutil.MockStorageProvider{
		CreateSignedUploadResult: &output.SignedUpload{
			Path:      "/path/to/file",
			Token:     "test-token",
			ExpiresIn: 15 * time.Minute,
		},
	}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	result, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 1 {
		t.Errorf("expected 1 result, got %d", len(result))
	}
	if result[0].Path != "/path/to/file" {
		t.Errorf("expected Path /path/to/file, got %s", result[0].Path)
	}
}

func TestCreateReviewUploads_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		storeID string
		userID  string
		files   []input.UploadFileInput
	}{
		{
			name:    "empty storeID",
			storeID: "",
			userID:  "user-1",
			files:   []input.UploadFileInput{{FileName: "image.jpg", ContentType: "image/jpeg"}},
		},
		{
			name:    "empty userID",
			storeID: "store-1",
			userID:  "",
			files:   []input.UploadFileInput{{FileName: "image.jpg", ContentType: "image/jpeg"}},
		},
		{
			name:    "empty files",
			storeID: "store-1",
			userID:  "user-1",
			files:   []input.UploadFileInput{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			storage := &testutil.MockStorageProvider{}
			fileRepo := &testutil.MockFileRepository{}
			storeRepo := &testutil.MockStoreRepository{}

			uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

			_, err := uc.CreateReviewUploads(context.Background(), tt.storeID, tt.userID, tt.files)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestCreateReviewUploads_StoreNotFound(t *testing.T) {
	storage := &testutil.MockStorageProvider{}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "nonexistent", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestCreateReviewUploads_InvalidContentType(t *testing.T) {
	invalidTypes := []string{
		"text/plain",
		"application/pdf",
		"video/mp4",
		"audio/mpeg",
	}

	for _, contentType := range invalidTypes {
		t.Run(contentType, func(t *testing.T) {
			storage := &testutil.MockStorageProvider{}
			fileRepo := &testutil.MockFileRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

			uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

			_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
				{FileName: "file.txt", ContentType: contentType},
			})
			if !errors.Is(err, usecase.ErrInvalidContentType) {
				t.Errorf("expected ErrInvalidContentType for %s, got %v", contentType, err)
			}
		})
	}
}

func TestCreateReviewUploads_ValidContentTypes(t *testing.T) {
	validTypes := []string{
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
	}

	for _, contentType := range validTypes {
		t.Run(contentType, func(t *testing.T) {
			storage := &testutil.MockStorageProvider{
				CreateSignedUploadResult: &output.SignedUpload{
					Path: "/path/to/file",
				},
			}
			fileRepo := &testutil.MockFileRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

			uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

			result, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
				{FileName: "image.jpg", ContentType: contentType},
			})
			if err != nil {
				t.Errorf("expected no error for content type %s, got %v", contentType, err)
			}
			if len(result) != 1 {
				t.Errorf("expected 1 result, got %d", len(result))
			}
		})
	}
}

func TestCreateReviewUploads_InvalidFileName(t *testing.T) {
	tests := []struct {
		name     string
		fileName string
	}{
		{"empty fileName", ""},
		{"whitespace only", "   "},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			storage := &testutil.MockStorageProvider{}
			fileRepo := &testutil.MockFileRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

			uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

			_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
				{FileName: tt.fileName, ContentType: "image/jpeg"},
			})
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput for fileName %q, got %v", tt.fileName, err)
			}
		})
	}
}

func TestCreateReviewUploads_EmptyContentType(t *testing.T) {
	storage := &testutil.MockStorageProvider{}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: ""},
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput for empty contentType, got %v", err)
	}
}

func TestCreateReviewUploads_FileRepoCreateError(t *testing.T) {
	createErr := errors.New("create error")
	storage := &testutil.MockStorageProvider{}
	fileRepo := &testutil.MockFileRepository{CreateErr: createErr}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

func TestCreateReviewUploads_LinkToStoreError(t *testing.T) {
	linkErr := errors.New("link error")
	storage := &testutil.MockStorageProvider{}
	fileRepo := &testutil.MockFileRepository{LinkToStoreErr: linkErr}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if !errors.Is(err, linkErr) {
		t.Errorf("expected link error, got %v", err)
	}
}

func TestCreateReviewUploads_StorageProviderError(t *testing.T) {
	storageErr := errors.New("storage error")
	storage := &testutil.MockStorageProvider{CreateSignedUploadErr: storageErr}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if !errors.Is(err, storageErr) {
		t.Errorf("expected storage error, got %v", err)
	}
}

func TestCreateReviewUploads_MultipleFiles(t *testing.T) {
	storage := &testutil.MockStorageProvider{
		CreateSignedUploadResult: &output.SignedUpload{
			Path: "/path/to/file",
		},
	}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	result, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image1.jpg", ContentType: "image/jpeg"},
		{FileName: "image2.png", ContentType: "image/png"},
		{FileName: "image3.gif", ContentType: "image/gif"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 3 {
		t.Errorf("expected 3 results, got %d", len(result))
	}
}

func TestCreateReviewUploads_StoreRepoError(t *testing.T) {
	dbErr := errors.New("database error")
	storage := &testutil.MockStorageProvider{}
	fileRepo := &testutil.MockFileRepository{}
	storeRepo := &testutil.MockStoreRepository{FindByIDErr: dbErr}

	uc := usecase.NewMediaUseCase(storage, fileRepo, storeRepo, "test-bucket")

	_, err := uc.CreateReviewUploads(context.Background(), "store-1", "user-1", []input.UploadFileInput{
		{FileName: "image.jpg", ContentType: "image/jpeg"},
	})
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}
