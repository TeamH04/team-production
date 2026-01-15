package testutil

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

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
