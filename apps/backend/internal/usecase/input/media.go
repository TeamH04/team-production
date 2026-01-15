package input

import "context"

// MediaUseCase defines inbound port for media uploads.
type MediaUseCase interface {
	CreateReviewUploads(ctx context.Context, storeID string, userID string, files []UploadFileInput) ([]SignedUploadFile, error)
}

type UploadFileInput struct {
	FileName    string
	FileSize    *int64
	ContentType string
}

type SignedUploadFile struct {
	FileID      string
	ObjectKey   string
	Path        string
	Token       string
	ContentType string
}
