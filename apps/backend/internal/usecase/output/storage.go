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
	CreateSignedDownload(ctx context.Context, bucket, objectPath string, expiresIn time.Duration) (*SignedDownload, error)
}

type SignedUpload struct {
	Bucket      string
	Path        string
	Token       string
	ExpiresIn   time.Duration
	ContentType string
	Upsert      bool
}

type SignedDownload struct {
	Bucket    string
	Path      string
	URL       string
	ExpiresIn time.Duration
}
