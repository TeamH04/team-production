package input_port

// UploadMediaRequest は /api/media/upload のリクエストボディです
type UploadMediaRequest struct {
	FileType string `json:"file_type"`
}
