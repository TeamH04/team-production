package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// MediaUseCase はアップロード処理に関するビジネスロジックを提供します
type MediaUseCase interface {
	CreateReviewUploads(ctx context.Context, storeID string, userID string, files []input.UploadFileInput) ([]input.SignedUploadFile, error)
}

type mediaUseCase struct {
	storage   output.StorageProvider
	fileRepo  output.FileRepository
	storeRepo output.StoreRepository
	bucket    string
}

// allowedContentTypes は許可されたContent-Typeのホワイトリスト
var allowedContentTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

// isAllowedContentType はContent-Typeが許可されているかを確認します
func isAllowedContentType(contentType string) bool {
	return allowedContentTypes[strings.ToLower(contentType)]
}

// NewMediaUseCase は MediaUseCase の実装を生成します
func NewMediaUseCase(
	storage output.StorageProvider,
	fileRepo output.FileRepository,
	storeRepo output.StoreRepository,
	bucket string,
) MediaUseCase {
	return &mediaUseCase{
		storage:   storage,
		fileRepo:  fileRepo,
		storeRepo: storeRepo,
		bucket:    bucket,
	}
}

func (uc *mediaUseCase) CreateReviewUploads(ctx context.Context, storeID string, userID string, files []input.UploadFileInput) ([]input.SignedUploadFile, error) {
	if storeID == "" || userID == "" || len(files) == 0 {
		return nil, ErrInvalidInput
	}
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	results := make([]input.SignedUploadFile, 0, len(files))
	for _, file := range files {
		fileName := strings.TrimSpace(file.FileName)
		contentType := strings.TrimSpace(file.ContentType)
		if fileName == "" || contentType == "" {
			return nil, ErrInvalidInput
		}
		if !isAllowedContentType(contentType) {
			return nil, ErrInvalidContentType
		}

		objectKey := fmt.Sprintf("reviews/%s/%s/%s", storeID, userID, uuid.NewString())

		createdBy := userID
		record := entity.File{
			FileKind:    "review",
			FileName:    fileName,
			FileSize:    file.FileSize,
			ObjectKey:   objectKey,
			ContentType: &contentType,
			CreatedBy:   &createdBy,
		}

		if err := uc.fileRepo.Create(ctx, &record); err != nil {
			return nil, err
		}
		if err := uc.fileRepo.LinkToStore(ctx, storeID, record.FileID); err != nil {
			return nil, err
		}

		signed, err := uc.storage.CreateSignedUpload(ctx, uc.bucket, objectKey, contentType, 15*time.Minute, false)
		if err != nil {
			return nil, err
		}

		results = append(results, input.SignedUploadFile{
			FileID:      record.FileID,
			ObjectKey:   objectKey,
			Path:        signed.Path,
			Token:       signed.Token,
			ContentType: contentType,
		})
	}

	return results, nil
}
