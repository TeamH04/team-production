package middleware_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// --- JWTAuth Tests ---

func TestJWTAuth_Success(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		FindByIDResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestJWTAuth_MissingHeader(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for missing header, got nil")
	}
}

func TestJWTAuth_InvalidFormat(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "InvalidFormat")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for invalid format, got nil")
	}
}

func TestJWTAuth_InvalidToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{
		Err: errors.New("invalid token"),
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for invalid token, got nil")
	}
}

func TestJWTAuth_UserNotFound_CreatesUser(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		FindByIDErr:      usecase.ErrUserNotFound,
		EnsureUserResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestJWTAuth_UserNotFound_EnsureUserFails(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		FindByIDErr:   usecase.ErrUserNotFound,
		EnsureUserErr: errors.New("database error"),
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for ensure user failure, got nil")
	}
}

// --- RequireRole Tests ---

func TestRequireRole_HasRole(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Set user in context
	user := entity.User{UserID: "user-1"}
	requestcontext.SetToContext(c, user, "admin")

	mockUC := &testutil.MockUserUseCase{}
	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.RequireRole("admin", "superadmin")(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestRequireRole_NoRole(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Set user in context with insufficient role
	user := entity.User{UserID: "user-1"}
	requestcontext.SetToContext(c, user, "user")

	mockUC := &testutil.MockUserUseCase{}
	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.RequireRole("admin")(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for insufficient role, got nil")
	}
}

func TestRequireRole_NoContext(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// No user in context

	mockUC := &testutil.MockUserUseCase{}
	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.RequireRole("admin")(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	if err == nil {
		t.Fatal("expected error for missing context, got nil")
	}
}

// --- OptionalAuth Tests ---

func TestOptionalAuth_WithValidToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		FindByIDResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	var userFromContext entity.User
	handler := mw.OptionalAuth(mockVerifier)(func(c echo.Context) error {
		u, err := requestcontext.GetUserFromContext(c.Request().Context())
		if err != nil {
			return err
		}
		userFromContext = u
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if userFromContext.UserID != "user-1" {
		t.Errorf("expected user to be set in context, got %+v", userFromContext)
	}
}

func TestOptionalAuth_WithoutToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.OptionalAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestOptionalAuth_WithInvalidToken(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{
		Err: errors.New("invalid token"),
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.OptionalAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	// OptionalAuth should continue even with invalid token
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

func TestOptionalAuth_WithInvalidFormat(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "InvalidFormat")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{}
	mockVerifier := &testutil.MockTokenVerifier{}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.OptionalAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	// OptionalAuth should continue even with invalid format
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

// --- Nil Dependency Tests ---

// TestJWTAuth_NilUserUseCase tests that JWTAuth returns an internal server error
// when the AuthMiddleware is created with a nil userUC.
func TestJWTAuth_NilUserUseCase(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
	}

	// Create AuthMiddleware with nil userUC
	mw := middleware.NewAuthMiddleware(nil)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	// Expect an internal server error due to nil userUC
	if err == nil {
		t.Fatal("expected error for nil userUC, got nil")
	}

	// Verify it's an internal server error (status 500)
	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Status != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, httpErr.Status)
	}
}

// TestJWTAuth_NilVerifier tests that JWTAuth returns an internal server error
// when called with a nil verifier.
func TestJWTAuth_NilVerifier(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		FindByIDResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}

	// Create valid AuthMiddleware but call JWTAuth with nil verifier
	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(nil)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	// Expect an internal server error due to nil verifier
	if err == nil {
		t.Fatal("expected error for nil verifier, got nil")
	}

	// Verify it's an internal server error (status 500)
	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Status != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, httpErr.Status)
	}
}

// --- findOrEnsureUser Error Handling Tests ---

// mockUserUseCaseWithTracking is an extended mock that tracks method calls
// Used to verify that EnsureUser is NOT called when FindByID returns a database error
type mockUserUseCaseWithTracking struct {
	findByIDResult   entity.User
	findByIDErr      error
	ensureUserResult entity.User
	ensureUserErr    error
	ensureUserCalled bool
}

func (m *mockUserUseCaseWithTracking) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserUseCaseWithTracking) EnsureUser(ctx context.Context, in input.EnsureUserInput) (entity.User, error) {
	m.ensureUserCalled = true
	if m.ensureUserErr != nil {
		return entity.User{}, m.ensureUserErr
	}
	return m.ensureUserResult, nil
}

func (m *mockUserUseCaseWithTracking) UpdateUser(ctx context.Context, userID string, in input.UpdateUserInput) (entity.User, error) {
	return entity.User{}, nil
}

func (m *mockUserUseCaseWithTracking) UpdateUserRole(ctx context.Context, userID string, role string) error {
	return nil
}

func (m *mockUserUseCaseWithTracking) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	return nil, nil
}

// TestJWTAuth_FindByID_DatabaseError tests that when FindByID returns a database error
// (not ErrUserNotFound), the error is returned directly and EnsureUser is NOT called.
// This ensures proper error propagation for unexpected database failures.
func TestJWTAuth_FindByID_DatabaseError(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Create a custom database error (not ErrUserNotFound)
	dbError := errors.New("database connection failed")

	mockUC := &mockUserUseCaseWithTracking{
		findByIDErr: dbError,
	}
	mockVerifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)

	// Expect the database error to be returned
	if err == nil {
		t.Fatal("expected database error to be returned, got nil")
	}

	// Verify the error is the original database error
	if err.Error() != dbError.Error() {
		t.Errorf("expected error message %q, got %q", dbError.Error(), err.Error())
	}

	// Verify EnsureUser was NOT called
	if mockUC.ensureUserCalled {
		t.Error("EnsureUser should NOT be called when FindByID returns a database error")
	}
}

// --- Edge Case Tests for Optional Authentication ---

// TestJWTAuth_EmptyUserIDInClaims tests the behavior when token verification succeeds
// but the claims contain an empty UserID.
// This tests how the system handles edge cases in token claims.
func TestJWTAuth_EmptyUserIDInClaims(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &testutil.MockUserUseCase{
		// FindByID with empty userID will likely fail or return not found
		FindByIDErr: usecase.ErrUserNotFound,
		// EnsureUser would be called with empty UserID
		EnsureUserResult: entity.User{UserID: "", Email: "test@example.com"},
	}
	mockVerifier := &testutil.MockTokenVerifier{
		// Token verification succeeds but UserID is empty
		Claims: &security.TokenClaims{UserID: "", Role: "user", Email: "test@example.com"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	handler := mw.JWTAuth(mockVerifier)(func(c echo.Context) error {
		// Check the user that was set in context
		user, err := requestcontext.GetUserFromContext(c.Request().Context())
		if err != nil {
			t.Fatalf("failed to get user from context: %v", err)
		}
		// Verify the user has empty ID (reflecting the claims)
		if user.UserID != "" {
			t.Errorf("expected empty UserID in context, got %q", user.UserID)
		}
		return c.String(http.StatusOK, "success")
	})

	err := handler(c)
	// The middleware should process this (behavior depends on implementation)
	// Currently, it will proceed with empty UserID and call EnsureUser
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}
