package output

import (
	"context"
	"time"
)

// StorageProvider represents an external object storage boundary.
type StorageProvider interface {
	CreateSignedUpload(
		ctx context.Context,
		bucket, objectPath, contentType string,
		expiresIn time.Duration,
		upsert bool,
	) (*SignedUpload, error)
}

type SignedUpload struct {
	Bucket      string
	Path        string
	Token       string
	ExpiresIn   time.Duration
	ContentType string
	Upsert      bool
}
