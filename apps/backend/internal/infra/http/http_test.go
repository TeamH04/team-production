// Package http provides common HTTP utilities for infrastructure layer.
package http

import (
	"testing"
)

func TestHTTPErrorStatusThreshold(t *testing.T) {
	// Verify the constant is set to 300 (start of redirect status codes)
	expected := 300
	if HTTPErrorStatusThreshold != expected {
		t.Errorf("HTTPErrorStatusThreshold = %d, want %d", HTTPErrorStatusThreshold, expected)
	}
}

func TestIsHTTPError(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		want       bool
	}{
		// Successful responses (1xx, 2xx) - should NOT be errors
		{
			name:       "100 Continue is not an error",
			statusCode: 100,
			want:       false,
		},
		{
			name:       "200 OK is not an error",
			statusCode: 200,
			want:       false,
		},
		{
			name:       "201 Created is not an error",
			statusCode: 201,
			want:       false,
		},
		{
			name:       "204 No Content is not an error",
			statusCode: 204,
			want:       false,
		},
		{
			name:       "299 (last 2xx) is not an error",
			statusCode: 299,
			want:       false,
		},

		// Redirect responses (3xx) - should be errors
		{
			name:       "300 Multiple Choices is an error",
			statusCode: 300,
			want:       true,
		},
		{
			name:       "301 Moved Permanently is an error",
			statusCode: 301,
			want:       true,
		},
		{
			name:       "302 Found is an error",
			statusCode: 302,
			want:       true,
		},
		{
			name:       "304 Not Modified is an error",
			statusCode: 304,
			want:       true,
		},
		{
			name:       "307 Temporary Redirect is an error",
			statusCode: 307,
			want:       true,
		},

		// Client errors (4xx) - should be errors
		{
			name:       "400 Bad Request is an error",
			statusCode: 400,
			want:       true,
		},
		{
			name:       "401 Unauthorized is an error",
			statusCode: 401,
			want:       true,
		},
		{
			name:       "403 Forbidden is an error",
			statusCode: 403,
			want:       true,
		},
		{
			name:       "404 Not Found is an error",
			statusCode: 404,
			want:       true,
		},
		{
			name:       "409 Conflict is an error",
			statusCode: 409,
			want:       true,
		},
		{
			name:       "422 Unprocessable Entity is an error",
			statusCode: 422,
			want:       true,
		},
		{
			name:       "429 Too Many Requests is an error",
			statusCode: 429,
			want:       true,
		},

		// Server errors (5xx) - should be errors
		{
			name:       "500 Internal Server Error is an error",
			statusCode: 500,
			want:       true,
		},
		{
			name:       "501 Not Implemented is an error",
			statusCode: 501,
			want:       true,
		},
		{
			name:       "502 Bad Gateway is an error",
			statusCode: 502,
			want:       true,
		},
		{
			name:       "503 Service Unavailable is an error",
			statusCode: 503,
			want:       true,
		},
		{
			name:       "504 Gateway Timeout is an error",
			statusCode: 504,
			want:       true,
		},

		// Boundary cases
		{
			name:       "0 is not an error",
			statusCode: 0,
			want:       false,
		},
		{
			name:       "negative status code is not an error",
			statusCode: -1,
			want:       false,
		},
		{
			name:       "999 is an error",
			statusCode: 999,
			want:       true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := IsHTTPError(tt.statusCode)
			if got != tt.want {
				t.Errorf("IsHTTPError(%d) = %v, want %v", tt.statusCode, got, tt.want)
			}
		})
	}
}

func TestIsHTTPError_BoundaryValues(t *testing.T) {
	// Test the exact boundary between non-error and error
	t.Run("299 is the last non-error status", func(t *testing.T) {
		if IsHTTPError(299) {
			t.Error("IsHTTPError(299) = true, want false")
		}
	})

	t.Run("300 is the first error status", func(t *testing.T) {
		if !IsHTTPError(300) {
			t.Error("IsHTTPError(300) = false, want true")
		}
	})
}

func TestIsHTTPError_CommonStatusCodes(t *testing.T) {
	// Test common HTTP status codes that are frequently used
	successCodes := []int{200, 201, 202, 204}
	for _, code := range successCodes {
		if IsHTTPError(code) {
			t.Errorf("IsHTTPError(%d) should be false for success codes", code)
		}
	}

	errorCodes := []int{400, 401, 403, 404, 500, 502, 503}
	for _, code := range errorCodes {
		if !IsHTTPError(code) {
			t.Errorf("IsHTTPError(%d) should be true for error codes", code)
		}
	}
}
