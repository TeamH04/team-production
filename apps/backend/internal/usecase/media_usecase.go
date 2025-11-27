package usecase

import (
	"context"
	"path"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
)

// MediaUseCase はメディアアップロードに関するビジネスロジックを提供します
type MediaUseCase interface {
	GetMediaByID(ctx context.Context, mediaID int64) (*domain.Media, error)
	CreateMedia(ctx context.Context, input CreateMediaInput) (*domain.Media, error)
	GenerateUploadURL(ctx context.Context, userID string, fileType string) (*SignedUploadURL, error)
}

type CreateMediaInput struct {
	UserID   string
	URL      string
	FileType string
	FileSize int64
}

type SignedUploadURL = ports.SignedUploadURL
type StorageProvider = ports.StorageProvider
type MediaRepository = ports.MediaRepository

type mediaUseCase struct {
	mediaRepo    MediaRepository
	storage      StorageProvider
	bucket       string
	uploadURLTTL time.Duration
}

// NewMediaUseCase は MediaUseCase の実装を生成します
func NewMediaUseCase(mediaRepo MediaRepository, storage StorageProvider, bucket string) MediaUseCase {
	return &mediaUseCase{
		mediaRepo:    mediaRepo,
		storage:      storage,
		bucket:       bucket,
		uploadURLTTL: 15 * time.Minute,
	}
}

func (uc *mediaUseCase) GetMediaByID(ctx context.Context, mediaID int64) (*domain.Media, error) {
	return uc.mediaRepo.FindByID(ctx, mediaID)
}

func (uc *mediaUseCase) CreateMedia(ctx context.Context, input CreateMediaInput) (*domain.Media, error) {
	if input.UserID == "" || input.URL == "" {
		return nil, ErrInvalidInput
	}

	media := &domain.Media{
		UserID:   input.UserID,
		URL:      input.URL,
		FileType: input.FileType,
		FileSize: input.FileSize,
	}

	if err := uc.mediaRepo.Create(ctx, media); err != nil {
		return nil, err
	}

	return media, nil
}

func (uc *mediaUseCase) GenerateUploadURL(ctx context.Context, userID string, fileType string) (*SignedUploadURL, error) {
	if userID == "" {
		return nil, ErrInvalidInput
	}
	if strings.TrimSpace(fileType) == "" {
		return nil, ErrInvalidInput
	}
	if uc.storage == nil {
		return nil, ErrInvalidInput
	}

	objectPath := path.Join(userID, uuid.New().String())
	return uc.storage.GenerateSignedUploadURL(ctx, uc.bucket, objectPath, fileType, uc.uploadURLTTL)
}
