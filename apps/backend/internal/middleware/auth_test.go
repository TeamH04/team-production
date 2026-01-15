package middleware_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/middleware"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// mockUserUseCase implements input.UserUseCase for testing
type mockUserUseCase struct {
	findByIDResult   entity.User
	findByIDErr      error
	ensureUserResult entity.User
	ensureUserErr    error
}

func (m *mockUserUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserUseCase) EnsureUser(ctx context.Context, in input.EnsureUserInput) (entity.User, error) {
	if m.ensureUserErr != nil {
		return entity.User{}, m.ensureUserErr
	}
	return m.ensureUserResult, nil
}

func (m *mockUserUseCase) UpdateUser(ctx context.Context, userID string, in input.UpdateUserInput) (entity.User, error) {
	return entity.User{}, nil
}

func (m *mockUserUseCase) UpdateUserRole(ctx context.Context, userID string, role string) error {
	return nil
}

func (m *mockUserUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	return nil, nil
}

// mockTokenVerifier implements security.TokenVerifier for testing
type mockTokenVerifier struct {
	claims *security.TokenClaims
	err    error
}

func (m *mockTokenVerifier) Verify(ctx context.Context, token string) (*security.TokenClaims, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.claims, nil
}

// --- JWTAuth Tests ---

func TestJWTAuth_Success(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	mockUC := &mockUserUseCase{
		findByIDResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &mockTokenVerifier{
		claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{}

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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{}

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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{
		err: errors.New("invalid token"),
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

	mockUC := &mockUserUseCase{
		findByIDErr:      usecase.ErrUserNotFound,
		ensureUserResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &mockTokenVerifier{
		claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
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

	mockUC := &mockUserUseCase{
		findByIDErr:   usecase.ErrUserNotFound,
		ensureUserErr: errors.New("database error"),
	}
	mockVerifier := &mockTokenVerifier{
		claims: &security.TokenClaims{UserID: "user-1", Role: "user", Email: "test@example.com"},
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

	mockUC := &mockUserUseCase{}
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

	mockUC := &mockUserUseCase{}
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

	mockUC := &mockUserUseCase{}
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

	mockUC := &mockUserUseCase{
		findByIDResult: entity.User{UserID: "user-1", Email: "test@example.com"},
	}
	mockVerifier := &mockTokenVerifier{
		claims: &security.TokenClaims{UserID: "user-1", Role: "user"},
	}

	mw := middleware.NewAuthMiddleware(mockUC)
	var userFromContext entity.User
	handler := mw.OptionalAuth(mockVerifier)(func(c echo.Context) error {
		u, _ := requestcontext.GetUserFromContext(c.Request().Context())
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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{}

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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{
		err: errors.New("invalid token"),
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

	mockUC := &mockUserUseCase{}
	mockVerifier := &mockTokenVerifier{}

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
