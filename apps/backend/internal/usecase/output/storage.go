package output

import (
	"context"
	"time"
)

// StorageProvider represents an external object storage boundary.
type StorageProvider interface {
	GenerateSignedUploadURL(ctx context.Context, bucket, objectPath, contentType string, expiresIn time.Duration) (*SignedUploadURL, error)
}

type SignedUploadURL struct {
	URL         string
	Path        string
	Token       string
	ExpiresIn   time.Duration
	ContentType string
}
