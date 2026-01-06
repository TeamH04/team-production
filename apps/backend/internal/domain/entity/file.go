package entity

import "time"

type File struct {
	FileID      string
	FileKind    string
	FileName    string
	FileSize    *int64
	ObjectKey   string
	ContentType *string
	IsDeleted   bool
	CreatedAt   time.Time
	CreatedBy   *string
}
