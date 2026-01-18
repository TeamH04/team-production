package requestcontext_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

// Role constants for testing
const (
	roleAdmin = "admin"
	roleUser  = "user"
)

// --- Test Helper Functions ---

// createTestUser creates a test user with the given ID and email
func createTestUser(userID, email string) entity.User {
	return entity.User{
		UserID:    userID,
		Name:      "Test User",
		Email:     email,
		Provider:  "google",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// createEchoContext creates a new echo.Context for testing
func createEchoContext() echo.Context {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec)
}

// --- SetUserToContext and GetUserFromContext Tests ---

func TestSetUserToContext_GetUserFromContext_Success(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")

	ctx = requestcontext.SetUserToContext(ctx, user, roleAdmin)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotUser.UserID != user.UserID {
		t.Errorf("expected UserID %q, got %q", user.UserID, gotUser.UserID)
	}
	if gotUser.Email != user.Email {
		t.Errorf("expected Email %q, got %q", user.Email, gotUser.Email)
	}
	if gotUser.Name != user.Name {
		t.Errorf("expected Name %q, got %q", user.Name, gotUser.Name)
	}
}

func TestGetUserFromContext_NoUserSet(t *testing.T) {
	ctx := context.Background()

	_, err := requestcontext.GetUserFromContext(ctx)

	if err == nil {
		t.Fatal("expected error when no user in context, got nil")
	}
	if !errors.Is(err, requestcontext.ErrNoUserInContext) {
		t.Errorf("expected ErrNoUserInContext, got %v", err)
	}
}

func TestGetUserFromContext_NilContext(t *testing.T) {
	// context.Background() is used as the base - testing with a context that has no value
	ctx := context.Background()

	_, err := requestcontext.GetUserFromContext(ctx)

	if !errors.Is(err, requestcontext.ErrNoUserInContext) {
		t.Errorf("expected ErrNoUserInContext, got %v", err)
	}
}

func TestSetUserToContext_OverwriteExistingUser(t *testing.T) {
	ctx := context.Background()
	user1 := createTestUser("user-1", "user1@example.com")
	user2 := createTestUser("user-2", "user2@example.com")

	ctx = requestcontext.SetUserToContext(ctx, user1, roleUser)
	ctx = requestcontext.SetUserToContext(ctx, user2, roleUser)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotUser.UserID != user2.UserID {
		t.Errorf("expected overwritten user with UserID %q, got %q", user2.UserID, gotUser.UserID)
	}
}

func TestSetUserToContext_WithEmptyUser(t *testing.T) {
	ctx := context.Background()
	emptyUser := entity.User{}

	ctx = requestcontext.SetUserToContext(ctx, emptyUser, roleUser)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotUser.UserID != "" {
		t.Errorf("expected empty UserID, got %q", gotUser.UserID)
	}
}

func TestSetUserToContext_PreservesAllUserFields(t *testing.T) {
	ctx := context.Background()
	iconFileID := "icon-123"
	iconURL := "https://example.com/icon.png"
	gender := "male"
	birthday := time.Date(1990, 1, 15, 0, 0, 0, 0, time.UTC)
	createdAt := time.Date(2024, 1, 1, 10, 0, 0, 0, time.UTC)
	updatedAt := time.Date(2024, 6, 15, 14, 30, 0, 0, time.UTC)

	user := entity.User{
		UserID:     "user-full",
		Name:       "Full User",
		Email:      "full@example.com",
		IconFileID: &iconFileID,
		Provider:   "apple",
		IconURL:    &iconURL,
		Gender:     &gender,
		Birthday:   &birthday,
		Role:       "premium",
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}

	ctx = requestcontext.SetUserToContext(ctx, user, roleAdmin)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify all fields are preserved
	if gotUser.UserID != user.UserID {
		t.Errorf("UserID: expected %q, got %q", user.UserID, gotUser.UserID)
	}
	if gotUser.Name != user.Name {
		t.Errorf("Name: expected %q, got %q", user.Name, gotUser.Name)
	}
	if gotUser.Email != user.Email {
		t.Errorf("Email: expected %q, got %q", user.Email, gotUser.Email)
	}
	if gotUser.IconFileID == nil || *gotUser.IconFileID != iconFileID {
		t.Errorf("IconFileID: expected %q, got %v", iconFileID, gotUser.IconFileID)
	}
	if gotUser.Provider != user.Provider {
		t.Errorf("Provider: expected %q, got %q", user.Provider, gotUser.Provider)
	}
	if gotUser.IconURL == nil || *gotUser.IconURL != iconURL {
		t.Errorf("IconURL: expected %q, got %v", iconURL, gotUser.IconURL)
	}
	if gotUser.Gender == nil || *gotUser.Gender != gender {
		t.Errorf("Gender: expected %q, got %v", gender, gotUser.Gender)
	}
	if gotUser.Birthday == nil || !gotUser.Birthday.Equal(birthday) {
		t.Errorf("Birthday: expected %v, got %v", birthday, gotUser.Birthday)
	}
	verifyUserRole(t, gotUser.Role, user.Role)
	verifyCreatedAt(t, gotUser.CreatedAt, createdAt)
	verifyUpdatedAt(t, gotUser.UpdatedAt, updatedAt)
}

// Helper functions to reduce cognitive complexity
func verifyUserRole(t *testing.T, got, expected string) {
	t.Helper()
	if got != expected {
		t.Errorf("Role: expected %q, got %q", expected, got)
	}
}

func verifyCreatedAt(t *testing.T, got, expected time.Time) {
	t.Helper()
	if !got.Equal(expected) {
		t.Errorf("CreatedAt: expected %v, got %v", expected, got)
	}
}

func verifyUpdatedAt(t *testing.T, got, expected time.Time) {
	t.Helper()
	if !got.Equal(expected) {
		t.Errorf("UpdatedAt: expected %v, got %v", expected, got)
	}
}

// --- SetUserToContext and GetUserRoleFromContext Tests ---

func TestSetUserToContext_GetUserRoleFromContext_Success(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")

	ctx = requestcontext.SetUserToContext(ctx, user, roleAdmin)

	gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotRole != roleAdmin {
		t.Errorf("expected role %q, got %q", roleAdmin, gotRole)
	}
}

func TestGetUserRoleFromContext_NoRoleSet(t *testing.T) {
	ctx := context.Background()

	_, err := requestcontext.GetUserRoleFromContext(ctx)

	if err == nil {
		t.Fatal("expected error when no role in context, got nil")
	}
	if !errors.Is(err, requestcontext.ErrNoUserRoleInContext) {
		t.Errorf("expected ErrNoUserRoleInContext, got %v", err)
	}
}

func TestGetUserRoleFromContext_EmptyRole(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")
	emptyRole := ""

	ctx = requestcontext.SetUserToContext(ctx, user, emptyRole)

	_, err := requestcontext.GetUserRoleFromContext(ctx)

	if err == nil {
		t.Fatal("expected error when role is empty, got nil")
	}
	if !errors.Is(err, requestcontext.ErrNoUserRoleInContext) {
		t.Errorf("expected ErrNoUserRoleInContext, got %v", err)
	}
}

func TestSetUserToContext_OverwriteExistingRole(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")

	ctx = requestcontext.SetUserToContext(ctx, user, roleUser)
	ctx = requestcontext.SetUserToContext(ctx, user, roleAdmin)

	gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotRole != roleAdmin {
		t.Errorf("expected overwritten role %q, got %q", roleAdmin, gotRole)
	}
}

func TestSetUserToContext_DifferentRoles(t *testing.T) {
	roles := []string{"user", "admin", "superadmin", "moderator", "guest"}

	for _, role := range roles {
		t.Run("role_"+role, func(t *testing.T) {
			ctx := context.Background()
			user := createTestUser("user-123", "test@example.com")

			ctx = requestcontext.SetUserToContext(ctx, user, role)

			gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if gotRole != role {
				t.Errorf("expected role %q, got %q", role, gotRole)
			}
		})
	}
}

// --- SetToContext Tests (Echo Context Integration) ---

func TestSetToContext_Success(t *testing.T) {
	c := createEchoContext()
	user := createTestUser("user-123", "test@example.com")
	role := roleAdmin

	requestcontext.SetToContext(c, user, role)

	// Verify user can be retrieved from echo context's request context
	gotUser, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error getting user: %v", err)
	}
	if gotUser.UserID != user.UserID {
		t.Errorf("expected UserID %q, got %q", user.UserID, gotUser.UserID)
	}

	// Verify role can be retrieved
	gotRole, err := requestcontext.GetUserRoleFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error getting role: %v", err)
	}
	if gotRole != role {
		t.Errorf("expected role %q, got %q", role, gotRole)
	}
}

func TestSetToContext_ReturnsEchoContext(t *testing.T) {
	c := createEchoContext()
	user := createTestUser("user-123", "test@example.com")
	role := roleUser

	returnedC := requestcontext.SetToContext(c, user, role)

	if returnedC == nil {
		t.Fatal("expected returned context to be non-nil")
	}

	// The returned context should have the same user
	gotUser, err := requestcontext.GetUserFromContext(returnedC.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.UserID != user.UserID {
		t.Errorf("expected UserID %q, got %q", user.UserID, gotUser.UserID)
	}
}

func TestSetToContext_OverwriteExisting(t *testing.T) {
	c := createEchoContext()
	user1 := createTestUser("user-1", "user1@example.com")
	user2 := createTestUser("user-2", "user2@example.com")
	role1 := "user"
	role2 := "admin"

	requestcontext.SetToContext(c, user1, role1)
	requestcontext.SetToContext(c, user2, role2)

	gotUser, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.UserID != user2.UserID {
		t.Errorf("expected overwritten user with UserID %q, got %q", user2.UserID, gotUser.UserID)
	}

	gotRole, err := requestcontext.GetUserRoleFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRole != role2 {
		t.Errorf("expected overwritten role %q, got %q", role2, gotRole)
	}
}

func TestSetToContext_WithEmptyUser(t *testing.T) {
	c := createEchoContext()
	emptyUser := entity.User{}
	role := roleUser

	requestcontext.SetToContext(c, emptyUser, role)

	gotUser, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.UserID != "" {
		t.Errorf("expected empty UserID, got %q", gotUser.UserID)
	}
}

// --- Error Variable Tests ---

func TestErrNoUserInContext_ErrorMessage(t *testing.T) {
	err := requestcontext.ErrNoUserInContext
	expected := "no user in context"

	if err.Error() != expected {
		t.Errorf("expected error message %q, got %q", expected, err.Error())
	}
}

func TestErrNoUserRoleInContext_ErrorMessage(t *testing.T) {
	err := requestcontext.ErrNoUserRoleInContext
	expected := "no user role in context"

	if err.Error() != expected {
		t.Errorf("expected error message %q, got %q", expected, err.Error())
	}
}

// --- Context Inheritance Tests ---

func TestContextInheritance_ChildContextPreservesValues(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")
	role := roleAdmin

	ctx = requestcontext.SetUserToContext(ctx, user, role)

	// Create child context with additional value
	type customKey struct{}
	childCtx := context.WithValue(ctx, customKey{}, "custom-value")

	// User and role should still be accessible from child context
	gotUser, err := requestcontext.GetUserFromContext(childCtx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.UserID != user.UserID {
		t.Errorf("expected UserID %q from child context, got %q", user.UserID, gotUser.UserID)
	}

	gotRole, err := requestcontext.GetUserRoleFromContext(childCtx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRole != role {
		t.Errorf("expected role %q from child context, got %q", role, gotRole)
	}
}

func TestContextInheritance_ParentContextUnchanged(t *testing.T) {
	parentCtx := context.Background()
	user := createTestUser("user-123", "test@example.com")

	// SetUserToContext returns a new context
	childCtx := requestcontext.SetUserToContext(parentCtx, user, roleAdmin)

	// Parent context should NOT have user/role
	_, err := requestcontext.GetUserFromContext(parentCtx)
	if !errors.Is(err, requestcontext.ErrNoUserInContext) {
		t.Errorf("expected parent context to not have user, got: %v", err)
	}

	// Child context should have user/role
	gotUser, err := requestcontext.GetUserFromContext(childCtx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.UserID != user.UserID {
		t.Errorf("expected UserID %q from child context, got %q", user.UserID, gotUser.UserID)
	}
}

// --- Concurrent Access Tests ---

func TestConcurrentAccess_MultipleGoroutines(t *testing.T) {
	ctx := context.Background()
	user := createTestUser("user-123", "test@example.com")
	role := roleAdmin

	ctx = requestcontext.SetUserToContext(ctx, user, role)

	// Run multiple concurrent reads
	done := make(chan bool, 10)
	for i := 0; i < 10; i++ {
		go func() {
			defer func() { done <- true }()

			gotUser, err := requestcontext.GetUserFromContext(ctx)
			if err != nil {
				t.Errorf("concurrent read error: %v", err)
				return
			}
			if gotUser.UserID != user.UserID {
				t.Errorf("concurrent read: expected UserID %q, got %q", user.UserID, gotUser.UserID)
			}

			gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
			if err != nil {
				t.Errorf("concurrent read error: %v", err)
				return
			}
			if gotRole != role {
				t.Errorf("concurrent read: expected role %q, got %q", role, gotRole)
			}
		}()
	}

	// Wait for all goroutines to complete
	for i := 0; i < 10; i++ {
		<-done
	}
}

// --- Echo Context Integration Tests ---

func TestEchoContext_MiddlewarePattern(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	user := createTestUser("user-123", "test@example.com")
	role := roleAdmin

	// Simulate middleware setting user
	requestcontext.SetToContext(c, user, role)

	// Simulate handler accessing user
	gotUser, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("handler failed to get user: %v", err)
	}
	if gotUser.UserID != user.UserID {
		t.Errorf("handler: expected UserID %q, got %q", user.UserID, gotUser.UserID)
	}

	gotRole, err := requestcontext.GetUserRoleFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("handler failed to get role: %v", err)
	}
	if gotRole != role {
		t.Errorf("handler: expected role %q, got %q", role, gotRole)
	}
}

func TestEchoContext_ChainedMiddleware(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	user := createTestUser("user-123", "test@example.com")
	initialRole := "user"

	// First middleware sets initial context
	requestcontext.SetToContext(c, user, initialRole)

	// Verify first middleware's values
	gotRole, err := requestcontext.GetUserRoleFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRole != initialRole {
		t.Errorf("expected initial role %q, got %q", initialRole, gotRole)
	}

	// Second middleware can update the context
	upgradedRole := "admin"
	requestcontext.SetToContext(c, user, upgradedRole)

	// Verify updated values
	gotRole, err = requestcontext.GetUserRoleFromContext(c.Request().Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRole != upgradedRole {
		t.Errorf("expected upgraded role %q, got %q", upgradedRole, gotRole)
	}
}

func TestEchoContext_DifferentHTTPMethods(t *testing.T) {
	methods := []string{
		http.MethodGet,
		http.MethodPost,
		http.MethodPut,
		http.MethodPatch,
		http.MethodDelete,
	}

	user := createTestUser("user-123", "test@example.com")
	role := roleUser

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(method, "/", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)

			requestcontext.SetToContext(c, user, role)

			gotUser, err := requestcontext.GetUserFromContext(c.Request().Context())
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if gotUser.UserID != user.UserID {
				t.Errorf("expected UserID %q, got %q", user.UserID, gotUser.UserID)
			}
		})
	}
}

// --- Boundary and Edge Case Tests ---

func TestSetUserToContext_WithNilPointerFields(t *testing.T) {
	ctx := context.Background()
	user := entity.User{
		UserID:     "user-nil-fields",
		Name:       "Nil Fields User",
		Email:      "nil@example.com",
		IconFileID: nil,
		Provider:   "google",
		IconURL:    nil,
		Gender:     nil,
		Birthday:   nil,
		Role:       "user",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	role := roleUser

	ctx = requestcontext.SetUserToContext(ctx, user, role)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if gotUser.IconFileID != nil {
		t.Errorf("expected nil IconFileID, got %v", gotUser.IconFileID)
	}
	if gotUser.IconURL != nil {
		t.Errorf("expected nil IconURL, got %v", gotUser.IconURL)
	}
	if gotUser.Gender != nil {
		t.Errorf("expected nil Gender, got %v", gotUser.Gender)
	}
	if gotUser.Birthday != nil {
		t.Errorf("expected nil Birthday, got %v", gotUser.Birthday)
	}
}

func TestSetUserToContext_WithSpecialCharactersInRole(t *testing.T) {
	specialRoles := []string{
		"role-with-dash",
		"role_with_underscore",
		"role.with.dots",
		"UPPERCASE_ROLE",
		"role123",
		"  role with spaces  ",
	}

	for _, role := range specialRoles {
		t.Run(role, func(t *testing.T) {
			ctx := context.Background()
			user := createTestUser("user-123", "test@example.com")

			ctx = requestcontext.SetUserToContext(ctx, user, role)

			gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if gotRole != role {
				t.Errorf("expected role %q, got %q", role, gotRole)
			}
		})
	}
}

func TestSetUserToContext_WithUnicodeInUserFields(t *testing.T) {
	ctx := context.Background()
	user := entity.User{
		UserID:    "user-unicode",
		Name:      "\u7530\u4e2d\u592a\u90ce", // Japanese name
		Email:     "unicode@example.com",
		Provider:  "google",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	role := "\u7ba1\u7406\u8005" // "Administrator" in Japanese

	ctx = requestcontext.SetUserToContext(ctx, user, role)

	gotUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotUser.Name != user.Name {
		t.Errorf("expected Name %q, got %q", user.Name, gotUser.Name)
	}

	gotRole, err := requestcontext.GetUserRoleFromContext(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRole != role {
		t.Errorf("expected role %q, got %q", role, gotRole)
	}
}

// --- Table-Driven Tests ---

func TestGetUserFromContext_TableDriven(t *testing.T) {
	tests := []struct {
		name        string
		setupCtx    func() context.Context
		wantErr     bool
		expectedErr error
	}{
		{
			name: "valid user in context",
			setupCtx: func() context.Context {
				ctx := context.Background()
				user := createTestUser("user-123", "test@example.com")
				return requestcontext.SetUserToContext(ctx, user, roleUser)
			},
			wantErr: false,
		},
		{
			name:        "no user in context",
			setupCtx:    context.Background,
			wantErr:     true,
			expectedErr: requestcontext.ErrNoUserInContext,
		},
		{
			name: "empty user in context",
			setupCtx: func() context.Context {
				ctx := context.Background()
				return requestcontext.SetUserToContext(ctx, entity.User{}, roleUser)
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := tt.setupCtx()
			_, err := requestcontext.GetUserFromContext(ctx)

			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				} else if tt.expectedErr != nil && !errors.Is(err, tt.expectedErr) {
					t.Errorf("expected error %v, got %v", tt.expectedErr, err)
				}
			} else if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestGetUserRoleFromContext_TableDriven(t *testing.T) {
	tests := []struct {
		name        string
		setupCtx    func() context.Context
		wantErr     bool
		expectedErr error
		wantRole    string
	}{
		{
			name: "valid role in context",
			setupCtx: func() context.Context {
				ctx := context.Background()
				user := createTestUser("user-123", "test@example.com")
				return requestcontext.SetUserToContext(ctx, user, roleAdmin)
			},
			wantErr:  false,
			wantRole: roleAdmin,
		},
		{
			name:        "no role in context",
			setupCtx:    context.Background,
			wantErr:     true,
			expectedErr: requestcontext.ErrNoUserRoleInContext,
		},
		{
			name: "empty role in context",
			setupCtx: func() context.Context {
				ctx := context.Background()
				user := createTestUser("user-123", "test@example.com")
				return requestcontext.SetUserToContext(ctx, user, "")
			},
			wantErr:     true,
			expectedErr: requestcontext.ErrNoUserRoleInContext,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx := tt.setupCtx()
			role, err := requestcontext.GetUserRoleFromContext(ctx)

			switch {
			case tt.wantErr:
				if err == nil {
					t.Error("expected error, got nil")
				} else if tt.expectedErr != nil && !errors.Is(err, tt.expectedErr) {
					t.Errorf("expected error %v, got %v", tt.expectedErr, err)
				}
			case err != nil:
				t.Errorf("unexpected error: %v", err)
			case role != tt.wantRole:
				t.Errorf("expected role %q, got %q", tt.wantRole, role)
			}
		})
	}
}
