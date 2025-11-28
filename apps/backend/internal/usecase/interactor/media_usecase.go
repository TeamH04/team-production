package interactor

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
)

// MediaUseCase はメディアアップロードに関するビジネスロジックを提供します
type MediaUseCase interface {
	GetMediaByID(ctx context.Context, mediaID int64) (*domain.Media, error)
	CreateMedia(ctx context.Context, input CreateMediaInput) (*domain.Media, error)
	GenerateUploadURL(ctx context.Context, userID string, fileType string) (string, error)
}

type CreateMediaInput struct {
	UserID   string
	URL      string
	FileType string
	FileSize int64
}

type mediaUseCase struct {
	mediaRepo repository.MediaRepository
}

// NewMediaUseCase は MediaUseCase の実装を生成します
func NewMediaUseCase(mediaRepo repository.MediaRepository) MediaUseCase {
	return &mediaUseCase{
		mediaRepo: mediaRepo,
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

func (uc *mediaUseCase) GenerateUploadURL(ctx context.Context, userID string, fileType string) (string, error) {
	// Supabase Storage の署名付きURL生成
	// 実際の実装ではSupabase SDKを使用
	// 仮の実装として固定URLを返す
	return "https://storage.supabase.co/upload-url", nil
}
