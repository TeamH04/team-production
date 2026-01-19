// Package http provides common HTTP utilities for infrastructure layer.
package http

// HTTPErrorStatusThreshold is the threshold status code that indicates an error.
// Status codes >= this value are considered errors (3xx redirects, 4xx client errors, 5xx server errors).
const HTTPErrorStatusThreshold = 300

// HTTP header names
const (
	HeaderContentType   = "Content-Type"
	HeaderAuthorization = "Authorization"
	HeaderAPIKey        = "apikey" // Supabase specific header
)

// MIME types
const (
	MimeTypeJSON = "application/json"
)

// IsHTTPError returns true if the status code indicates an error.
func IsHTTPError(statusCode int) bool {
	return statusCode >= HTTPErrorStatusThreshold
}
