package presentation_test

import (
	"errors"
	"net/http"
	"strings"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
)

// ========== HTTPError Tests ==========

func TestHTTPError_Error(t *testing.T) {
	tests := []struct {
		name     string
		status   int
		expected string
	}{
		{
			name:     "BadRequest status",
			status:   http.StatusBadRequest,
			expected: "http error 400",
		},
		{
			name:     "Unauthorized status",
			status:   http.StatusUnauthorized,
			expected: "http error 401",
		},
		{
			name:     "Forbidden status",
			status:   http.StatusForbidden,
			expected: "http error 403",
		},
		{
			name:     "NotFound status",
			status:   http.StatusNotFound,
			expected: "http error 404",
		},
		{
			name:     "InternalServerError status",
			status:   http.StatusInternalServerError,
			expected: "http error 500",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := presentation.NewHTTPError(tt.status, nil)
			if err.Error() != tt.expected {
				t.Errorf("expected error message '%s', got '%s'", tt.expected, err.Error())
			}
		})
	}
}

func TestNewHTTPError(t *testing.T) {
	tests := []struct {
		name           string
		status         int
		body           any
		expectedStatus int
	}{
		{
			name:           "with string body",
			status:         http.StatusBadRequest,
			body:           "error message",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "with nil body",
			status:         http.StatusNotFound,
			body:           nil,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "with struct body",
			status:         http.StatusInternalServerError,
			body:           presentation.NewErrorResponse("test error"),
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := presentation.NewHTTPError(tt.status, tt.body)
			if err == nil {
				t.Fatal("expected error, got nil")
			}

			var httpErr *presentation.HTTPError
			if !errors.As(err, &httpErr) {
				t.Fatal("expected *HTTPError type")
			}

			if httpErr.Status != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, httpErr.Status)
			}
		})
	}
}

func TestNewHTTPError_BodyPreservation(t *testing.T) {
	body := presentation.NewErrorResponse("test error")
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	errResp, ok := httpErr.Body.(presentation.ErrorResponse)
	if !ok {
		t.Fatal("expected ErrorResponse body type")
	}

	if errResp.Error != "test error" {
		t.Errorf("expected error message 'test error', got '%s'", errResp.Error)
	}
}

// ========== NewBadRequest Tests ==========

func TestNewBadRequest(t *testing.T) {
	tests := []struct {
		name    string
		message string
	}{
		{
			name:    "normal message",
			message: "invalid input",
		},
		{
			name:    "empty message",
			message: "",
		},
		{
			name:    "long message",
			message: strings.Repeat("a", 1000),
		},
		{
			name:    "special characters",
			message: "error: <script>alert('xss')</script>",
		},
		{
			name:    "unicode characters",
			message: "エラー: 無効な入力",
		},
		{
			name:    "newline characters",
			message: "error\nwith\nnewlines",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := presentation.NewBadRequest(tt.message)
			if err == nil {
				t.Fatal("expected error, got nil")
			}

			var httpErr *presentation.HTTPError
			if !errors.As(err, &httpErr) {
				t.Fatal("expected *HTTPError type")
			}

			if httpErr.Status != http.StatusBadRequest {
				t.Errorf("expected status %d, got %d", http.StatusBadRequest, httpErr.Status)
			}

			errResp, ok := httpErr.Body.(presentation.ErrorResponse)
			if !ok {
				t.Fatal("expected ErrorResponse body type")
			}

			if errResp.Error != tt.message {
				t.Errorf("expected error message '%s', got '%s'", tt.message, errResp.Error)
			}
		})
	}
}

// ========== HTTP Error Constructor Tests ==========

// testHTTPErrorConstructor is a helper function that tests HTTP error constructors
// to eliminate code duplication across TestNewUnauthorized, TestNewForbidden,
// TestNewNotFound, and TestNewInternalServerError.
func testHTTPErrorConstructor(t *testing.T, constructor func(string) error, expectedStatus int, testCases []struct {
	name    string
	message string
},
) {
	t.Helper()
	for _, tt := range testCases {
		t.Run(tt.name, func(t *testing.T) {
			err := constructor(tt.message)
			if err == nil {
				t.Fatal("expected error, got nil")
			}

			var httpErr *presentation.HTTPError
			if !errors.As(err, &httpErr) {
				t.Fatal("expected *HTTPError type")
			}

			if httpErr.Status != expectedStatus {
				t.Errorf("expected status %d, got %d", expectedStatus, httpErr.Status)
			}

			errResp, ok := httpErr.Body.(presentation.ErrorResponse)
			if !ok {
				t.Fatal("expected ErrorResponse body type")
			}

			if errResp.Error != tt.message {
				t.Errorf("expected error message '%s', got '%s'", tt.message, errResp.Error)
			}
		})
	}
}

func TestNewUnauthorized(t *testing.T) {
	testCases := []struct {
		name    string
		message string
	}{
		{name: "normal message", message: "authentication required"},
		{name: "empty message", message: ""},
		{name: "long message", message: strings.Repeat("b", 1000)},
		{name: "special characters", message: "token<>invalid&chars"},
	}
	testHTTPErrorConstructor(t, presentation.NewUnauthorized, http.StatusUnauthorized, testCases)
}

func TestNewForbidden(t *testing.T) {
	testCases := []struct {
		name    string
		message string
	}{
		{name: "normal message", message: "access denied"},
		{name: "empty message", message: ""},
		{name: "long message", message: strings.Repeat("c", 1000)},
		{name: "special characters", message: "forbidden: /path/to/resource"},
	}
	testHTTPErrorConstructor(t, presentation.NewForbidden, http.StatusForbidden, testCases)
}

func TestNewInternalServerError(t *testing.T) {
	testCases := []struct {
		name    string
		message string
	}{
		{name: "normal message", message: "internal server error"},
		{name: "empty message", message: ""},
		{name: "long message", message: strings.Repeat("d", 1000)},
		{name: "special characters", message: "error: database connection failed [code: 500]"},
	}
	testHTTPErrorConstructor(t, presentation.NewInternalServerError, http.StatusInternalServerError, testCases)
}

// ========== MessageResponse Tests ==========

func TestNewMessageResponse(t *testing.T) {
	tests := []struct {
		name    string
		message string
	}{
		{
			name:    "normal message",
			message: "operation successful",
		},
		{
			name:    "empty message",
			message: "",
		},
		{
			name:    "long message",
			message: strings.Repeat("e", 1000),
		},
		{
			name:    "unicode characters",
			message: "処理が完了しました",
		},
		{
			name:    "special characters",
			message: "success: created <entity>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := presentation.NewMessageResponse(tt.message)

			if resp.Message != tt.message {
				t.Errorf("expected message '%s', got '%s'", tt.message, resp.Message)
			}
		})
	}
}

// ========== ErrorResponse Tests ==========

func TestNewErrorResponse(t *testing.T) {
	tests := []struct {
		name    string
		message string
	}{
		{
			name:    "normal message",
			message: "something went wrong",
		},
		{
			name:    "empty message",
			message: "",
		},
		{
			name:    "long message",
			message: strings.Repeat("f", 1000),
		},
		{
			name:    "unicode characters",
			message: "エラーが発生しました",
		},
		{
			name:    "special characters",
			message: "error: <invalid> & \"quoted\"",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := presentation.NewErrorResponse(tt.message)

			if resp.Error != tt.message {
				t.Errorf("expected error '%s', got '%s'", tt.message, resp.Error)
			}
		})
	}
}

// ========== StatusFromError Tests ==========

func TestStatusFromError(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		expectedStatus int
	}{
		{
			name:           "CodeNotFound returns 404",
			err:            apperr.New(apperr.CodeNotFound, errors.New("not found")),
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "CodeInvalidInput returns 400",
			err:            apperr.New(apperr.CodeInvalidInput, errors.New("invalid input")),
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "CodeConflict returns 409",
			err:            apperr.New(apperr.CodeConflict, errors.New("conflict")),
			expectedStatus: http.StatusConflict,
		},
		{
			name:           "CodeUnauthorized returns 401",
			err:            apperr.New(apperr.CodeUnauthorized, errors.New("unauthorized")),
			expectedStatus: http.StatusUnauthorized,
		},
		{
			name:           "CodeForbidden returns 403",
			err:            apperr.New(apperr.CodeForbidden, errors.New("forbidden")),
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "CodeInternal returns 500",
			err:            apperr.New(apperr.CodeInternal, errors.New("internal")),
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "CodeUnknown returns 500",
			err:            apperr.New(apperr.CodeUnknown, errors.New("unknown")),
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "regular error returns 500",
			err:            errors.New("regular error"),
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "nil error returns 500",
			err:            nil,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status := presentation.StatusFromError(tt.err)

			if status != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, status)
			}
		})
	}
}

func TestStatusFromError_AllCodes(t *testing.T) {
	codeStatusMap := map[apperr.Code]int{
		apperr.CodeNotFound:     http.StatusNotFound,
		apperr.CodeInvalidInput: http.StatusBadRequest,
		apperr.CodeConflict:     http.StatusConflict,
		apperr.CodeUnauthorized: http.StatusUnauthorized,
		apperr.CodeForbidden:    http.StatusForbidden,
		apperr.CodeInternal:     http.StatusInternalServerError,
		apperr.CodeUnknown:      http.StatusInternalServerError,
	}

	for code, expectedStatus := range codeStatusMap {
		t.Run(string(code), func(t *testing.T) {
			err := apperr.New(code, nil)
			status := presentation.StatusFromError(err)

			if status != expectedStatus {
				t.Errorf("for code %s: expected status %d, got %d", code, expectedStatus, status)
			}
		})
	}
}

// ========== HTTPError Interface Tests ==========

func TestHTTPError_ImplementsError(t *testing.T) {
	_ = presentation.NewHTTPError(http.StatusBadRequest, nil) //nolint:errcheck
}

func TestHTTPError_TypeAssertion(t *testing.T) {
	err := presentation.NewBadRequest("test")

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected NewBadRequest to return *HTTPError")
	}

	if httpErr.Status != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, httpErr.Status)
	}
}

// ========== Edge Case Tests ==========

func TestHTTPError_ZeroStatus(t *testing.T) {
	err := presentation.NewHTTPError(0, nil)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	if httpErr.Status != 0 {
		t.Errorf("expected status 0, got %d", httpErr.Status)
	}

	if err.Error() != "http error 0" {
		t.Errorf("expected 'http error 0', got '%s'", err.Error())
	}
}

func TestHTTPError_NegativeStatus(t *testing.T) {
	err := presentation.NewHTTPError(-1, nil)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	if httpErr.Status != -1 {
		t.Errorf("expected status -1, got %d", httpErr.Status)
	}

	if err.Error() != "http error -1" {
		t.Errorf("expected 'http error -1', got '%s'", err.Error())
	}
}

func TestHTTPError_CustomStatus(t *testing.T) {
	customStatuses := []int{
		http.StatusCreated,
		http.StatusAccepted,
		http.StatusNoContent,
		http.StatusMovedPermanently,
		http.StatusFound,
		http.StatusNotModified,
		http.StatusConflict,
		http.StatusGone,
		http.StatusUnprocessableEntity,
		http.StatusTooManyRequests,
		http.StatusServiceUnavailable,
	}

	for _, status := range customStatuses {
		t.Run(http.StatusText(status), func(t *testing.T) {
			err := presentation.NewHTTPError(status, nil)

			var httpErr *presentation.HTTPError
			if !errors.As(err, &httpErr) {
				t.Fatal("expected *HTTPError type")
			}

			if httpErr.Status != status {
				t.Errorf("expected status %d, got %d", status, httpErr.Status)
			}
		})
	}
}

// ========== Body Type Tests ==========

func TestHTTPError_StringBody(t *testing.T) {
	body := "error message"
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	if httpErr.Body != body {
		t.Error("body was not preserved correctly")
	}
}

func TestHTTPError_IntBody(t *testing.T) {
	body := 42
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	if httpErr.Body != body {
		t.Error("body was not preserved correctly")
	}
}

func TestHTTPError_NilBody(t *testing.T) {
	err := presentation.NewHTTPError(http.StatusBadRequest, nil)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	if httpErr.Body != nil {
		t.Error("expected nil body")
	}
}

func TestHTTPError_MapBody(t *testing.T) {
	body := map[string]string{"error": "test"}
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	mapBody, ok := httpErr.Body.(map[string]string)
	if !ok {
		t.Fatal("expected map[string]string body type")
	}

	if mapBody["error"] != "test" {
		t.Errorf("expected error 'test', got '%s'", mapBody["error"])
	}
}

func TestHTTPError_SliceBody(t *testing.T) {
	body := []string{"error1", "error2"}
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	sliceBody, ok := httpErr.Body.([]string)
	if !ok {
		t.Fatal("expected []string body type")
	}

	if len(sliceBody) != 2 || sliceBody[0] != "error1" || sliceBody[1] != "error2" {
		t.Error("body was not preserved correctly")
	}
}

func TestHTTPError_StructBody(t *testing.T) {
	type customBody struct {
		Code    int
		Message string
	}
	body := customBody{Code: 400, Message: "bad request"}
	err := presentation.NewHTTPError(http.StatusBadRequest, body)

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatal("expected *HTTPError type")
	}

	structBody, ok := httpErr.Body.(customBody)
	if !ok {
		t.Fatal("expected customBody type")
	}

	if structBody.Code != 400 || structBody.Message != "bad request" {
		t.Error("body was not preserved correctly")
	}
}

// ========== Response Struct Field Tests ==========

func TestMessageResponse_Fields(t *testing.T) {
	resp := presentation.MessageResponse{Message: "test"}

	if resp.Message != "test" {
		t.Errorf("expected Message 'test', got '%s'", resp.Message)
	}
}

func TestErrorResponse_Fields(t *testing.T) {
	resp := presentation.ErrorResponse{Error: "test error"}

	if resp.Error != "test error" {
		t.Errorf("expected Error 'test error', got '%s'", resp.Error)
	}
}
