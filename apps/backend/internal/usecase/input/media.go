package input

import (
	"context"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// MediaUseCase defines inbound port for media operations.
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

type SignedUploadURL struct {
	URL         string
	Path        string
	Token       string
	ExpiresIn   time.Duration
	ContentType string
}
