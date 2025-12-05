package domain

import "errors"

// ErrNotFound represents missing domain entities regardless of the underlying store.
var ErrNotFound = errors.New("not found")
