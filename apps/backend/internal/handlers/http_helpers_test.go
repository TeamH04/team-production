package handlers

import (
	"errors"
	"math"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
)

// assertHTTPError validates that the error is an HTTPError with BadRequest status
func assertHTTPError(t *testing.T, err error) {
	t.Helper()
	require.NotNil(t, err, "expected error but got nil")

	var httpErr *presentation.HTTPError
	require.True(t, errors.As(err, &httpErr), "expected *presentation.HTTPError, got %T", err)
	require.Equal(t, http.StatusBadRequest, httpErr.Status, "expected BadRequest status")
}

// assertNoError validates successful parsing result
func assertNoError(t *testing.T, err error) {
	t.Helper()
	require.NoError(t, err)
}

// Helper function to create echo context with param
func createContextWithParam(paramName, paramValue string) echo.Context {
	e := echo.New()
	// URL-encode the parameter value to handle special characters and whitespace
	encodedValue := url.PathEscape(paramValue)
	req := httptest.NewRequest(http.MethodGet, "/test/"+encodedValue, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/test/:" + paramName)
	c.SetParamNames(paramName)
	// Use the original paramValue (not encoded) since Echo's Param() returns decoded value
	c.SetParamValues(paramValue)
	return c
}

// TestParseInt64Param tests the parseInt64Param function with various edge cases
func TestParseInt64Param(t *testing.T) {
	const errMsg = "invalid parameter"

	tests := []struct {
		name        string
		paramValue  string
		want        int64
		wantErr     bool
		description string
	}{
		{
			name:        "valid positive number",
			paramValue:  "123",
			want:        123,
			wantErr:     false,
			description: "Should parse valid positive integer",
		},
		{
			name:        "valid negative number",
			paramValue:  "-456",
			want:        -456,
			wantErr:     false,
			description: "Should parse valid negative integer",
		},
		{
			name:        "zero",
			paramValue:  "0",
			want:        0,
			wantErr:     false,
			description: "Should parse zero",
		},
		{
			name:        "MAX_INT64",
			paramValue:  "9223372036854775807",
			want:        math.MaxInt64,
			wantErr:     false,
			description: "Should parse maximum int64 value",
		},
		{
			name:        "MIN_INT64",
			paramValue:  "-9223372036854775808",
			want:        math.MinInt64,
			wantErr:     false,
			description: "Should parse minimum int64 value",
		},
		{
			name:        "overflow positive",
			paramValue:  "9223372036854775808",
			want:        0,
			wantErr:     true,
			description: "Should error on int64 overflow (MAX_INT64 + 1)",
		},
		{
			name:        "overflow negative",
			paramValue:  "-9223372036854775809",
			want:        0,
			wantErr:     true,
			description: "Should error on int64 underflow (MIN_INT64 - 1)",
		},
		{
			name:        "invalid string letters",
			paramValue:  "abc",
			want:        0,
			wantErr:     true,
			description: "Should error on alphabetic string",
		},
		{
			name:        "invalid string mixed",
			paramValue:  "123abc",
			want:        0,
			wantErr:     true,
			description: "Should error on mixed alphanumeric string",
		},
		{
			name:        "invalid string decimal",
			paramValue:  "12.34",
			want:        0,
			wantErr:     true,
			description: "Should error on decimal number",
		},
		{
			name:        "empty string",
			paramValue:  "",
			want:        0,
			wantErr:     true,
			description: "Should error on empty string",
		},
		{
			name:        "whitespace only",
			paramValue:  "   ",
			want:        0,
			wantErr:     true,
			description: "Should error on whitespace-only string",
		},
		{
			name:        "leading whitespace",
			paramValue:  " 123",
			want:        0,
			wantErr:     true,
			description: "Should error on number with leading whitespace",
		},
		{
			name:        "trailing whitespace",
			paramValue:  "123 ",
			want:        0,
			wantErr:     true,
			description: "Should error on number with trailing whitespace",
		},
		{
			name:        "plus sign prefix",
			paramValue:  "+123",
			want:        123,
			wantErr:     false,
			description: "Should parse number with explicit plus sign",
		},
		{
			name:        "leading zeros",
			paramValue:  "00123",
			want:        123,
			wantErr:     false,
			description: "Should parse number with leading zeros",
		},
		{
			name:        "special characters",
			paramValue:  "123!@#",
			want:        0,
			wantErr:     true,
			description: "Should error on number with special characters",
		},
		{
			name:        "hexadecimal format",
			paramValue:  "0x1F",
			want:        0,
			wantErr:     true,
			description: "Should error on hexadecimal format (base 10 only)",
		},
		{
			name:        "scientific notation",
			paramValue:  "1e5",
			want:        0,
			wantErr:     true,
			description: "Should error on scientific notation",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := createContextWithParam("id", tt.paramValue)

			got, err := parseInt64Param(c, "id", errMsg)

			if tt.wantErr {
				assertHTTPError(t, err)
				return
			}
			assertNoError(t, err)
			require.Equal(t, tt.want, got, tt.description)
		})
	}
}

// TestParseUUIDParam tests the parseUUIDParam function with various edge cases
func TestParseUUIDParam(t *testing.T) {
	const errMsg = "invalid UUID"

	tests := []struct {
		name        string
		paramValue  string
		want        string
		wantErr     bool
		description string
	}{
		{
			name:        "valid UUID v4",
			paramValue:  "550e8400-e29b-41d4-a716-446655440000",
			want:        "550e8400-e29b-41d4-a716-446655440000",
			wantErr:     false,
			description: "Should parse valid UUID v4",
		},
		{
			name:        "valid UUID v1",
			paramValue:  "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
			want:        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
			wantErr:     false,
			description: "Should parse valid UUID v1",
		},
		{
			name:        "nil UUID",
			paramValue:  "00000000-0000-0000-0000-000000000000",
			want:        "00000000-0000-0000-0000-000000000000",
			wantErr:     false,
			description: "Should parse nil UUID (all zeros)",
		},
		{
			name:        "uppercase UUID",
			paramValue:  "550E8400-E29B-41D4-A716-446655440000",
			want:        "550E8400-E29B-41D4-A716-446655440000",
			wantErr:     false,
			description: "Should parse uppercase UUID",
		},
		{
			name:        "mixed case UUID",
			paramValue:  "550e8400-E29B-41d4-A716-446655440000",
			want:        "550e8400-E29B-41d4-A716-446655440000",
			wantErr:     false,
			description: "Should parse mixed case UUID",
		},
		{
			name:        "empty string",
			paramValue:  "",
			want:        "",
			wantErr:     true,
			description: "Should error on empty string",
		},
		{
			name:        "leading whitespace",
			paramValue:  " 550e8400-e29b-41d4-a716-446655440000",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with leading whitespace",
		},
		{
			name:        "trailing whitespace",
			paramValue:  "550e8400-e29b-41d4-a716-446655440000 ",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with trailing whitespace",
		},
		{
			name:        "whitespace only",
			paramValue:  "   ",
			want:        "",
			wantErr:     true,
			description: "Should error on whitespace-only string",
		},
		{
			name:        "truncated UUID",
			paramValue:  "550e8400-e29b-41d4-a716",
			want:        "",
			wantErr:     true,
			description: "Should error on truncated UUID",
		},
		{
			name:        "UUID with extra characters at end",
			paramValue:  "550e8400-e29b-41d4-a716-446655440000extra",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with extra characters appended",
		},
		{
			name:        "UUID with extra characters at start",
			paramValue:  "prefix550e8400-e29b-41d4-a716-446655440000",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with extra characters prepended",
		},
		{
			name:        "invalid format - no hyphens",
			paramValue:  "550e8400e29b41d4a716446655440000",
			want:        "550e8400e29b41d4a716446655440000",
			wantErr:     false,
			description: "UUID without hyphens - google/uuid library accepts this",
		},
		{
			name:        "invalid format - wrong hyphen positions",
			paramValue:  "550e-8400-e29b-41d4-a716-446655440000",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with incorrect hyphen positions",
		},
		{
			name:        "invalid characters - contains g",
			paramValue:  "550e8400-e29b-41d4-a716-44665544000g",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID with invalid hex character 'g'",
		},
		{
			name:        "too short",
			paramValue:  "550e8400-e29b-41d4-a716-4466554400",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID that is too short",
		},
		{
			name:        "too long",
			paramValue:  "550e8400-e29b-41d4-a716-4466554400001",
			want:        "",
			wantErr:     true,
			description: "Should error on UUID that is too long",
		},
		{
			name:        "random string",
			paramValue:  "not-a-uuid-at-all",
			want:        "",
			wantErr:     true,
			description: "Should error on random non-UUID string",
		},
		{
			name:        "numeric string",
			paramValue:  "12345678901234567890123456789012",
			want:        "12345678901234567890123456789012",
			wantErr:     false,
			description: "32-char numeric string - google/uuid library accepts this as valid format",
		},
		{
			name:        "UUID with braces",
			paramValue:  "{550e8400-e29b-41d4-a716-446655440000}",
			want:        "{550e8400-e29b-41d4-a716-446655440000}",
			wantErr:     false,
			description: "UUID with braces - google/uuid library accepts this",
		},
		{
			name:        "UUID with urn prefix",
			paramValue:  "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
			want:        "urn:uuid:550e8400-e29b-41d4-a716-446655440000",
			wantErr:     false,
			description: "UUID with urn prefix - google/uuid library accepts this",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := createContextWithParam("id", tt.paramValue)

			got, err := parseUUIDParam(c, "id", errMsg)

			if tt.wantErr {
				assertHTTPError(t, err)
				return
			}
			assertNoError(t, err)
			require.Equal(t, tt.want, got, tt.description)
		})
	}
}

// TestBearerTokenFromHeader tests the bearerTokenFromHeader function with various edge cases
func TestBearerTokenFromHeader(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		want        string
		description string
	}{
		{
			name:        "empty string",
			input:       "",
			want:        "",
			description: "Should return empty for empty input",
		},
		{
			name:        "valid Bearer token",
			input:       "Bearer token123",
			want:        "token123",
			description: "Should extract token after 'Bearer ' prefix",
		},
		{
			name:        "lowercase bearer",
			input:       "bearer token123",
			want:        "bearer token123",
			description: "Lowercase 'bearer' is not recognized as prefix, returns trimmed input",
		},
		{
			name:        "double space after Bearer",
			input:       "Bearer  token123",
			want:        "token123",
			description: "Double space - TrimSpace removes leading space from token",
		},
		{
			name:        "Bearer with no token",
			input:       "Bearer ",
			want:        "",
			description: "Should return empty when no token after Bearer prefix",
		},
		{
			name:        "Bearer only",
			input:       "Bearer",
			want:        "Bearer",
			description: "'Bearer' without space is not recognized as prefix, returns as-is",
		},
		{
			name:        "token with spaces",
			input:       "Bearer token with spaces",
			want:        "token with spaces",
			description: "Should preserve spaces within token after prefix removal",
		},
		{
			name:        "very long token",
			input:       "Bearer " + strings.Repeat("a", 1000),
			want:        strings.Repeat("a", 1000),
			description: "Should handle very long tokens (1000+ chars)",
		},
		{
			name:        "token with newline",
			input:       "Bearer token\nwith\nnewlines",
			want:        "token\nwith\nnewlines",
			description: "Should preserve newlines in token",
		},
		{
			name:        "token with carriage return",
			input:       "Bearer token\r\nwith\r\ncrlf",
			want:        "token\r\nwith\r\ncrlf",
			description: "Should preserve CRLF in token",
		},
		{
			name:        "no Bearer prefix just token",
			input:       "token123",
			want:        "token123",
			description: "Should return trimmed value when no Bearer prefix",
		},
		{
			name:        "Basic auth header",
			input:       "Basic dXNlcjpwYXNz",
			want:        "Basic dXNlcjpwYXNz",
			description: "Should return trimmed value for non-Bearer auth type",
		},
		{
			name:        "Bearer with leading whitespace in header",
			input:       "  Bearer token123",
			want:        "Bearer token123",
			description: "Leading whitespace - no Bearer prefix match, returns trimmed input",
		},
		{
			name:        "Bearer with trailing whitespace",
			input:       "Bearer token123  ",
			want:        "token123",
			description: "Should trim trailing whitespace from token",
		},
		{
			name:        "whitespace only",
			input:       "   ",
			want:        "",
			description: "Should return empty for whitespace-only input",
		},
		{
			name:        "Bearer prefix only with extra spaces",
			input:       "Bearer    ",
			want:        "",
			description: "Should return empty when Bearer prefix followed by only spaces",
		},
		{
			name:        "mixed case Bearer",
			input:       "BEARER token123",
			want:        "BEARER token123",
			description: "Uppercase 'BEARER' is not recognized as prefix",
		},
		{
			name:        "Bearer with tab",
			input:       "Bearer\ttoken123",
			want:        "Bearer\ttoken123",
			description: "Tab after Bearer - not recognized as Bearer prefix (requires space)",
		},
		{
			name:        "JWT-like token",
			input:       "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
			want:        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
			description: "Should correctly extract JWT-like token",
		},
		{
			name:        "token with special characters",
			input:       "Bearer abc!@#$%^&*()_+-=[]{}|;':\",./<>?",
			want:        "abc!@#$%^&*()_+-=[]{}|;':\",./<>?",
			description: "Should preserve special characters in token",
		},
		{
			name:        "unicode token",
			input:       "Bearer token\u00e9\u00e8\u00ea",
			want:        "token\u00e9\u00e8\u00ea",
			description: "Should preserve unicode characters in token",
		},
		{
			name:        "empty token after multiple spaces",
			input:       "Bearer      ",
			want:        "",
			description: "Should return empty when only spaces follow Bearer prefix",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := bearerTokenFromHeader(tt.input)
			if got != tt.want {
				t.Errorf("bearerTokenFromHeader() = %q, want %q; %s", got, tt.want, tt.description)
			}
		})
	}
}

// TestParseInt64Param_ErrorMessage tests that the custom error message is used
func TestParseInt64Param_ErrorMessage(t *testing.T) {
	c := createContextWithParam("id", "invalid")
	customErrMsg := "custom error message for store id"

	_, err := parseInt64Param(c, "id", customErrMsg)

	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("expected *presentation.HTTPError, got %T", err)
	}

	errResp, ok := httpErr.Body.(presentation.ErrorResponse)
	if !ok {
		t.Fatalf("expected presentation.ErrorResponse body, got %T", httpErr.Body)
	}

	if errResp.Error != customErrMsg {
		t.Errorf("error message = %q, want %q", errResp.Error, customErrMsg)
	}
}

// TestParseUUIDParam_ErrorMessage tests that the custom error message is used
func TestParseUUIDParam_ErrorMessage(t *testing.T) {
	c := createContextWithParam("id", "invalid-uuid")
	customErrMsg := "custom error message for UUID"

	_, err := parseUUIDParam(c, "id", customErrMsg)

	if err == nil {
		t.Fatal("expected error, got nil")
	}

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("expected *presentation.HTTPError, got %T", err)
	}

	errResp, ok := httpErr.Body.(presentation.ErrorResponse)
	if !ok {
		t.Fatalf("expected presentation.ErrorResponse body, got %T", httpErr.Body)
	}

	if errResp.Error != customErrMsg {
		t.Errorf("error message = %q, want %q", errResp.Error, customErrMsg)
	}
}

// TestParseInt64Param_DifferentParamNames tests parsing with different param names
func TestParseInt64Param_DifferentParamNames(t *testing.T) {
	tests := []struct {
		paramName  string
		paramValue string
		want       int64
	}{
		{"id", "100", 100},
		{"store_id", "200", 200},
		{"review_id", "300", 300},
		{"offset", "0", 0},
		{"limit", "50", 50},
	}

	for _, tt := range tests {
		t.Run(tt.paramName, func(t *testing.T) {
			c := createContextWithParam(tt.paramName, tt.paramValue)

			got, err := parseInt64Param(c, tt.paramName, "error")
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if got != tt.want {
				t.Errorf("parseInt64Param() = %v, want %v", got, tt.want)
			}
		})
	}
}

// TestParseUUIDParam_DifferentParamNames tests parsing with different param names
func TestParseUUIDParam_DifferentParamNames(t *testing.T) {
	validUUID := "550e8400-e29b-41d4-a716-446655440000"

	tests := []struct {
		paramName string
	}{
		{"id"},
		{"store_id"},
		{"user_id"},
		{"review_id"},
	}

	for _, tt := range tests {
		t.Run(tt.paramName, func(t *testing.T) {
			c := createContextWithParam(tt.paramName, validUUID)

			got, err := parseUUIDParam(c, tt.paramName, "error")
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if got != validUUID {
				t.Errorf("parseUUIDParam() = %v, want %v", got, validUUID)
			}
		})
	}
}
