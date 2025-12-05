package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type MediaHandler struct {
	controller handlers.MediaController
}

func NewMediaHandler(controller handlers.MediaController) *MediaHandler {
	return &MediaHandler{controller: controller}
}

func (h *MediaHandler) GetMedia(c echo.Context) error {
	id, err := parseInt64Param(c, "id", "invalid media id")
	if err != nil {
		return err
	}
	media, err := h.controller.GetMedia(c.Request().Context(), id)
	if err != nil {
		return err
	}
	resp := presenter.NewMediaResponse(*media)
	return c.JSON(http.StatusOK, resp)
}

type uploadMediaDTO struct {
	FileType string `json:"file_type"`
}

func (dto uploadMediaDTO) toCommand() handlers.UploadMediaCommand {
	return handlers.UploadMediaCommand{FileType: dto.FileType}
}

func (h *MediaHandler) UploadMedia(c echo.Context) error {
	var dto uploadMediaDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	userID := requestcontext.UserID(c)
	url, err := h.controller.UploadMedia(c.Request().Context(), userID, dto.toCommand())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, struct {
		UploadURL string `json:"upload_url"`
		Token     string `json:"token"`
		Path      string `json:"path"`
		ExpiresIn int    `json:"expires_in"`
		Message   string `json:"message"`
	}{
		UploadURL: url.URL,
		Token:     url.Token,
		Path:      url.Path,
		ExpiresIn: int(url.ExpiresIn.Seconds()),
		Message:   "upload to this URL",
	})
}
