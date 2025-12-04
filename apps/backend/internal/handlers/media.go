package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type MediaHandler struct {
	mediaUseCase input.MediaUseCase
}

var _ MediaController = (*MediaHandler)(nil)

type UploadMediaCommand struct {
	FileType string
}

func NewMediaHandler(mediaUseCase input.MediaUseCase) *MediaHandler {
	return &MediaHandler{
		mediaUseCase: mediaUseCase,
	}
}

func (h *MediaHandler) GetMedia(ctx context.Context, mediaID int64) (*domain.Media, error) {
	return h.mediaUseCase.GetMediaByID(ctx, mediaID)
}

func (h *MediaHandler) UploadMedia(ctx context.Context, userID string, cmd UploadMediaCommand) (*input.SignedUploadURL, error) {
	if userID == "" {
		return nil, usecase.ErrUnauthorized
	}

	return h.mediaUseCase.GenerateUploadURL(ctx, userID, cmd.FileType)
}
