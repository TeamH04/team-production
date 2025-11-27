package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type MediaHandler struct {
	mediaUseCase usecase.MediaUseCase
}

var _ MediaController = (*MediaHandler)(nil)

type UploadMediaCommand struct {
	FileType string
}

func NewMediaHandler(mediaUseCase usecase.MediaUseCase) *MediaHandler {
	return &MediaHandler{
		mediaUseCase: mediaUseCase,
	}
}

func (h *MediaHandler) GetMedia(ctx context.Context, mediaID int64) (*domain.Media, error) {
	return h.mediaUseCase.GetMediaByID(ctx, mediaID)
}

func (h *MediaHandler) UploadMedia(ctx context.Context, userID string, cmd UploadMediaCommand) (*usecase.SignedUploadURL, error) {
	if userID == "" {
		return nil, usecase.ErrUnauthorized
	}

	return h.mediaUseCase.GenerateUploadURL(ctx, userID, cmd.FileType)
}
