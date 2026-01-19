package testutil

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

// --- Pointer Helper Functions ---

// StringPtr returns a pointer to the given string value.
func StringPtr(s string) *string { return &s }

// Int64Ptr returns a pointer to the given int64 value.
func Int64Ptr(i int64) *int64 { return &i }

// IntPtr returns a pointer to the given int value.
func IntPtr(i int) *int { return &i }

// Float64Ptr returns a pointer to the given float64 value.
func Float64Ptr(f float64) *float64 { return &f }

// TimePtr returns a pointer to the given time.Time value.
func TimePtr(t time.Time) *time.Time { return &t }

// BoolPtr returns a pointer to the given bool value.
func BoolPtr(b bool) *bool { return &b }

// MustMarshal marshals the given value to JSON bytes.
// It calls t.Fatal if marshaling fails.
func MustMarshal(t *testing.T, v any) []byte {
	t.Helper()
	data, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	return data
}

// TestContext holds the echo context and recorder for testing
type TestContext struct {
	Context  echo.Context
	Recorder *httptest.ResponseRecorder
	Echo     *echo.Echo
}

// NewTestContext creates a new test context with the given HTTP method, path, and optional body
func NewTestContext(method, path string, body io.Reader) *TestContext {
	e := echo.New()
	req := httptest.NewRequest(method, path, body)
	if body != nil {
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	}
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	return &TestContext{
		Context:  c,
		Recorder: rec,
		Echo:     e,
	}
}

// NewTestContextWithJSON creates a new test context with JSON body
func NewTestContextWithJSON(method, path, jsonBody string) *TestContext {
	return NewTestContext(method, path, strings.NewReader(jsonBody))
}

// NewTestContextNoBody creates a new test context without body
func NewTestContextNoBody(method, path string) *TestContext {
	return NewTestContext(method, path, nil)
}

// SetPath sets the path and parameter names/values for the context
func (tc *TestContext) SetPath(path string, paramNames []string, paramValues []string) *TestContext {
	tc.Context.SetPath(path)
	tc.Context.SetParamNames(paramNames...)
	tc.Context.SetParamValues(paramValues...)
	return tc
}

// SetUser sets the authenticated user in the context
func (tc *TestContext) SetUser(user entity.User, role string) *TestContext {
	requestcontext.SetToContext(tc.Context, user, role)
	return tc
}

// SetAuthHeader sets the Authorization header
func (tc *TestContext) SetAuthHeader(token string) *TestContext {
	tc.Context.Request().Header.Set("Authorization", "Bearer "+token)
	return tc
}

// AssertSuccess asserts that there was no error and the status code matches
func AssertSuccess(t *testing.T, err error, rec *httptest.ResponseRecorder, expectedStatus int) {
	t.Helper()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != expectedStatus {
		t.Errorf("expected status %d, got %d", expectedStatus, rec.Code)
	}
}

// AssertError asserts that an error occurred
func AssertError(t *testing.T, err error, message string) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error for %s, got nil", message)
	}
}

// AssertErrorIs asserts that an error occurred and matches the expected error using errors.Is.
func AssertErrorIs(t *testing.T, err, expected error, message string) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error for %s, got nil", message)
	}
	if !errors.Is(err, expected) {
		t.Errorf("%s: expected error %v, got %v", message, expected, err)
	}
}

// AssertErrorContains asserts that an error occurred and its message contains the expected substring.
func AssertErrorContains(t *testing.T, err error, substring string, message string) {
	t.Helper()
	if err == nil {
		t.Fatalf("expected error for %s, got nil", message)
	}
	if !strings.Contains(err.Error(), substring) {
		t.Errorf("%s: expected error containing %q, got %q", message, substring, err.Error())
	}
}

// AssertNoError asserts that no error occurred
func AssertNoError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// AssertStatus asserts the HTTP status code
func AssertStatus(t *testing.T, rec *httptest.ResponseRecorder, expectedStatus int) {
	t.Helper()
	if rec.Code != expectedStatus {
		t.Errorf("expected status %d, got %d", expectedStatus, rec.Code)
	}
}

// AssertStatusOK is a shorthand for AssertStatus with http.StatusOK
func AssertStatusOK(t *testing.T, rec *httptest.ResponseRecorder) {
	AssertStatus(t, rec, http.StatusOK)
}

// AssertStatusCreated is a shorthand for AssertStatus with http.StatusCreated
func AssertStatusCreated(t *testing.T, rec *httptest.ResponseRecorder) {
	AssertStatus(t, rec, http.StatusCreated)
}

// AssertStatusNoContent is a shorthand for AssertStatus with http.StatusNoContent
func AssertStatusNoContent(t *testing.T, rec *httptest.ResponseRecorder) {
	AssertStatus(t, rec, http.StatusNoContent)
}
