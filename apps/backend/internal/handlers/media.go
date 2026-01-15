package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type MediaHandler struct {
	mediaUseCase input.MediaUseCase
}

type uploadFileDTO struct {
	FileName    string `json:"file_name"`
	FileSize    *int64 `json:"file_size"`
	ContentType string `json:"content_type"`
}

type createUploadDTO struct {
	StoreID string          `json:"store_id"`
	Files   []uploadFileDTO `json:"files"`
}

type uploadFileResponse struct {
	FileID      string `json:"file_id"`
	ObjectKey   string `json:"object_key"`
	Path        string `json:"path"`
	Token       string `json:"token"`
	ContentType string `json:"content_type"`
}

type uploadResponse struct {
	Files []uploadFileResponse `json:"files"`
}

func NewMediaHandler(mediaUseCase input.MediaUseCase) *MediaHandler {
	return &MediaHandler{mediaUseCase: mediaUseCase}
}

func (h *MediaHandler) CreateReviewUploads(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	var dto createUploadDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	if dto.StoreID == "" || len(dto.Files) == 0 {
		return usecase.ErrInvalidInput
	}

	inputs := make([]input.UploadFileInput, len(dto.Files))
	for i, f := range dto.Files {
		inputs[i] = input.UploadFileInput{
			FileName:    f.FileName,
			FileSize:    f.FileSize,
			ContentType: f.ContentType,
		}
	}

	uploads, err := h.mediaUseCase.CreateReviewUploads(c.Request().Context(), dto.StoreID, user.UserID, inputs)
	if err != nil {
		return err
	}

	resp := make([]uploadFileResponse, len(uploads))
	for i, upload := range uploads {
		resp[i] = uploadFileResponse{
			FileID:      upload.FileID,
			ObjectKey:   upload.ObjectKey,
			Path:        upload.Path,
			Token:       upload.Token,
			ContentType: upload.ContentType,
		}
	}

	return c.JSON(http.StatusOK, uploadResponse{Files: resp})
}
