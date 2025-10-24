package handlers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type MediaHandler struct {
	mediaUseCase usecase.MediaUseCase
}

// NewMediaHandler は MediaHandler を生成します
func NewMediaHandler(mediaUseCase usecase.MediaUseCase) *MediaHandler {
	return &MediaHandler{
		mediaUseCase: mediaUseCase,
	}
}

// GetMedia はメディア情報を取得します
// GET /api/media/:id
func (h *MediaHandler) GetMedia(c echo.Context) error {
	ctx := c.Request().Context()

	idStr := c.Param("id")
	mediaID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid media id"})
	}

	media, err := h.mediaUseCase.GetMediaByID(ctx, mediaID)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "media not found"})
	}

	return c.JSON(http.StatusOK, media)
}

// UploadMedia はメディアのアップロード用署名付きURLを発行します
// POST /api/media/upload
func (h *MediaHandler) UploadMedia(c echo.Context) error {
	ctx := c.Request().Context()
	userID := middleware.GetUserID(c)

	var req struct {
		FileType string `json:"file_type"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid JSON"})
	}

	// 署名付きURLを生成
	uploadURL, err := h.mediaUseCase.GenerateUploadURL(ctx, userID, req.FileType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"upload_url": uploadURL,
		"message":    "upload to this URL",
	})
}
