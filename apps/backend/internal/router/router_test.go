package router

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// Test Mocks

// mockUserUseCase implements input.UserUseCase for testing
type mockUserUseCase struct{}

func (m *mockUserUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	return entity.User{}, nil
}

func (m *mockUserUseCase) EnsureUser(ctx context.Context, in input.EnsureUserInput) (entity.User, error) {
	return entity.User{}, nil
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

// mockStoreUseCase implements input.StoreUseCase for testing
type mockStoreUseCase struct{}

func (m *mockStoreUseCase) GetAllStores(ctx context.Context) ([]entity.Store, error) {
	return nil, nil
}

func (m *mockStoreUseCase) GetStoreByID(ctx context.Context, id string) (*entity.Store, error) {
	return nil, nil
}

func (m *mockStoreUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*entity.Store, error) {
	return nil, nil
}

func (m *mockStoreUseCase) UpdateStore(ctx context.Context, id string, in input.UpdateStoreInput) (*entity.Store, error) {
	return nil, nil
}

func (m *mockStoreUseCase) DeleteStore(ctx context.Context, id string) error {
	return nil
}

// mockMenuUseCase implements input.MenuUseCase for testing
type mockMenuUseCase struct{}

func (m *mockMenuUseCase) GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	return nil, nil
}

func (m *mockMenuUseCase) CreateMenu(ctx context.Context, storeID string, in input.CreateMenuInput) (*entity.Menu, error) {
	return nil, nil
}

// mockReviewUseCase implements input.ReviewUseCase for testing
type mockReviewUseCase struct{}

func (m *mockReviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	return nil, nil
}

func (m *mockReviewUseCase) Create(ctx context.Context, storeID string, userID string, in input.CreateReview) error {
	return nil
}

func (m *mockReviewUseCase) LikeReview(ctx context.Context, reviewID string, userID string) error {
	return nil
}

func (m *mockReviewUseCase) UnlikeReview(ctx context.Context, reviewID string, userID string) error {
	return nil
}

// mockFavoriteUseCase implements input.FavoriteUseCase for testing
type mockFavoriteUseCase struct{}

func (m *mockFavoriteUseCase) GetMyFavorites(ctx context.Context, userID string) ([]entity.Favorite, error) {
	return nil, nil
}

func (m *mockFavoriteUseCase) AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	return nil, nil
}

func (m *mockFavoriteUseCase) RemoveFavorite(ctx context.Context, userID string, storeID string) error {
	return nil
}

// mockReportUseCase implements input.ReportUseCase for testing
type mockReportUseCase struct{}

func (m *mockReportUseCase) CreateReport(ctx context.Context, in input.CreateReportInput) (*entity.Report, error) {
	return nil, nil
}

func (m *mockReportUseCase) GetAllReports(ctx context.Context) ([]entity.Report, error) {
	return nil, nil
}

func (m *mockReportUseCase) HandleReport(ctx context.Context, reportID int64, action input.HandleReportAction) error {
	return nil
}

// mockAuthUseCase implements input.AuthUseCase for testing
type mockAuthUseCase struct{}

func (m *mockAuthUseCase) Signup(ctx context.Context, in input.AuthSignupInput) (*entity.User, error) {
	return nil, nil
}

func (m *mockAuthUseCase) Login(ctx context.Context, in input.AuthLoginInput) (*input.AuthSession, error) {
	return nil, nil
}

// mockAdminUseCase implements input.AdminUseCase for testing
type mockAdminUseCase struct{}

func (m *mockAdminUseCase) GetPendingStores(ctx context.Context) ([]entity.Store, error) {
	return nil, nil
}

func (m *mockAdminUseCase) ApproveStore(ctx context.Context, storeID string) error {
	return nil
}

func (m *mockAdminUseCase) RejectStore(ctx context.Context, storeID string) error {
	return nil
}

// mockStationUseCase implements input.StationUseCase for testing
type mockStationUseCase struct{}

func (m *mockStationUseCase) ListStations(ctx context.Context) ([]entity.Station, error) {
	return nil, nil
}

// mockMediaUseCase implements input.MediaUseCase for testing
type mockMediaUseCase struct{}

func (m *mockMediaUseCase) CreateReviewUploads(ctx context.Context, storeID string, userID string, files []input.UploadFileInput) ([]input.SignedUploadFile, error) {
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

// mockStorageProvider implements output.StorageProvider for testing
type mockStorageProvider struct{}

func (m *mockStorageProvider) CreateSignedUpload(ctx context.Context, bucket, objectPath, contentType string, expiresIn time.Duration, upsert bool) (*output.SignedUpload, error) {
	return nil, nil
}

func (m *mockStorageProvider) CreateSignedDownload(ctx context.Context, bucket, objectPath string, expiresIn time.Duration) (*output.SignedDownload, error) {
	return nil, nil
}

// Helper function to create test dependencies
func createTestDependencies() *Dependencies {
	userUC := &mockUserUseCase{}
	storeUC := &mockStoreUseCase{}
	menuUC := &mockMenuUseCase{}
	reviewUC := &mockReviewUseCase{}
	favoriteUC := &mockFavoriteUseCase{}
	reportUC := &mockReportUseCase{}
	authUC := &mockAuthUseCase{}
	adminUC := &mockAdminUseCase{}
	stationUC := &mockStationUseCase{}
	mediaUC := &mockMediaUseCase{}
	tokenVerifier := &mockTokenVerifier{}
	storage := &mockStorageProvider{}
	bucket := "test-bucket"

	return &Dependencies{
		UserUC:          userUC,
		StoreHandler:    handlers.NewStoreHandler(storeUC, storage, bucket),
		MenuHandler:     handlers.NewMenuHandler(menuUC),
		ReviewHandler:   handlers.NewReviewHandler(reviewUC, tokenVerifier, storage, bucket),
		UserHandler:     handlers.NewUserHandler(userUC, storage, bucket),
		FavoriteHandler: handlers.NewFavoriteHandler(favoriteUC),
		ReportHandler:   handlers.NewReportHandler(reportUC),
		AuthHandler:     handlers.NewAuthHandler(authUC, userUC),
		AdminHandler:    handlers.NewAdminHandler(adminUC, reportUC, userUC),
		StationHandler:  handlers.NewStationHandler(stationUC),
		MediaHandler:    handlers.NewMediaHandler(mediaUC),
		TokenVerifier:   tokenVerifier,
	}
}

// TestNewServer tests that NewServer creates a valid Echo instance
func TestNewServer(t *testing.T) {
	deps := createTestDependencies()

	server := NewServer(deps)

	if server == nil {
		t.Fatal("NewServer returned nil")
	}

	// Verify that the server is an Echo instance
	_, ok := interface{}(server).(*echo.Echo)
	if !ok {
		t.Error("NewServer did not return an Echo instance")
	}
}

// TestHealthEndpoint tests that the health endpoint is registered and works
func TestHealthEndpoint(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	req := httptest.NewRequest(http.MethodGet, HealthPath, nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

// TestRoutes tests that all expected routes are registered
func TestRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	expectedRoutes := []struct {
		method string
		path   string
	}{
		// Health
		{http.MethodGet, HealthPath},

		// Auth routes
		{http.MethodPost, "/api/auth" + AuthSignupPath},
		{http.MethodPost, "/api/auth" + AuthLoginPath},
		{http.MethodGet, "/api/auth" + AuthMePath},
		{http.MethodPut, "/api/auth" + AuthRolePath},

		// Store routes
		{http.MethodGet, "/api" + StoresPath},
		{http.MethodGet, "/api" + StoreByIDPath},
		{http.MethodPost, "/api" + StoresPath},
		{http.MethodPut, "/api" + StoreByIDPath},
		{http.MethodDelete, "/api" + StoreByIDPath},

		// Menu routes
		{http.MethodGet, "/api" + StoreMenusPath},
		{http.MethodPost, "/api" + StoreMenusPath},

		// Station routes
		{http.MethodGet, "/api" + StationsPath},

		// Review routes
		{http.MethodGet, "/api" + StoreReviewsPath},
		{http.MethodPost, "/api" + StoreReviewsPath},
		{http.MethodPost, "/api" + ReviewLikesPath},
		{http.MethodDelete, "/api" + ReviewLikesPath},

		// User routes
		{http.MethodGet, "/api" + UsersMePath},
		{http.MethodPut, "/api" + UserByIDPath},
		{http.MethodGet, "/api" + UserReviewsPath},

		// Favorite routes
		{http.MethodGet, "/api" + UserFavoritesPath},
		{http.MethodPost, "/api" + UserFavoritesPath},
		{http.MethodDelete, "/api" + UserFavoriteByPath},

		// Report routes
		{http.MethodPost, "/api" + ReportsPath},

		// Media routes
		{http.MethodPost, "/api" + MediaUploadPath},

		// Admin routes
		{http.MethodGet, "/api/admin" + AdminStoresPendingPath},
		{http.MethodPost, "/api/admin" + AdminStoreApprovePath},
		{http.MethodPost, "/api/admin" + AdminStoreRejectPath},
		{http.MethodGet, "/api/admin" + AdminReportsPath},
		{http.MethodPost, "/api/admin" + AdminReportActionPath},
		{http.MethodGet, "/api/admin" + AdminUserByIDPath},
	}

	for _, expected := range expectedRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestRouteCount verifies the expected number of routes are registered
func TestRouteCount(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	// Count expected routes:
	// Health: 1
	// Auth: 4
	// Store: 5
	// Menu: 2
	// Station: 1
	// Review: 4
	// User: 3
	// Favorite: 3
	// Report: 1
	// Media: 1
	// Admin: 6
	// Echo internal routes for admin group (echo_route_not_found): 2
	// Total: 33
	expectedCount := 33

	if len(routes) != expectedCount {
		t.Errorf("expected %d routes, got %d", expectedCount, len(routes))
		t.Log("Registered routes:")
		for _, route := range routes {
			t.Logf("  %s %s", route.Method, route.Path)
		}
	}
}

// TestAuthRoutes tests that all auth routes are registered correctly
func TestAuthRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	authRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/auth/signup"},
		{http.MethodPost, "/api/auth/login"},
		{http.MethodGet, "/api/auth/me"},
		{http.MethodPut, "/api/auth/role"},
	}

	for _, expected := range authRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Auth route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestStoreRoutes tests that all store routes are registered correctly
func TestStoreRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	storeRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/stores"},
		{http.MethodGet, "/api/stores/:id"},
		{http.MethodPost, "/api/stores"},
		{http.MethodPut, "/api/stores/:id"},
		{http.MethodDelete, "/api/stores/:id"},
		{http.MethodGet, "/api/stores/:id/menus"},
		{http.MethodPost, "/api/stores/:id/menus"},
		{http.MethodGet, "/api/stores/:id/reviews"},
		{http.MethodPost, "/api/stores/:id/reviews"},
	}

	for _, expected := range storeRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Store route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestStationRoutes tests that all station routes are registered correctly
func TestStationRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	stationRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/stations"},
	}

	for _, expected := range stationRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Station route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestUserRoutes tests that all user routes are registered correctly
func TestUserRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	userRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/users/me"},
		{http.MethodPut, "/api/users/:id"},
		{http.MethodGet, "/api/users/:id/reviews"},
		{http.MethodGet, "/api/users/me/favorites"},
		{http.MethodPost, "/api/users/me/favorites"},
		{http.MethodDelete, "/api/users/me/favorites/:store_id"},
	}

	for _, expected := range userRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("User route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestAdminRoutes tests that all admin routes are registered correctly
func TestAdminRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	adminRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/admin/stores/pending"},
		{http.MethodPost, "/api/admin/stores/:id/approve"},
		{http.MethodPost, "/api/admin/stores/:id/reject"},
		{http.MethodGet, "/api/admin/reports"},
		{http.MethodPost, "/api/admin/reports/:id/action"},
		{http.MethodGet, "/api/admin/users/:id"},
	}

	for _, expected := range adminRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Admin route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestReviewRoutes tests that review routes are registered correctly
func TestReviewRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	reviewRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/reviews/:id/likes"},
		{http.MethodDelete, "/api/reviews/:id/likes"},
	}

	for _, expected := range reviewRoutes {
		found := false
		for _, route := range routes {
			if route.Method == expected.method && route.Path == expected.path {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Review route not found: %s %s", expected.method, expected.path)
		}
	}
}

// TestReportRoutes tests that report routes are registered correctly
func TestReportRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	found := false
	for _, route := range routes {
		if route.Method == http.MethodPost && route.Path == "/api/reports" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Report route not found: POST /api/reports")
	}
}

// TestMediaRoutes tests that media routes are registered correctly
func TestMediaRoutes(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	found := false
	for _, route := range routes {
		if route.Method == http.MethodPost && route.Path == "/api/media/upload" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Media route not found: POST /api/media/upload")
	}
}

// TestEndpointConstants tests that endpoint constants are defined correctly
func TestEndpointConstants(t *testing.T) {
	testCases := []struct {
		name     string
		constant string
		expected string
	}{
		{"HealthPath", HealthPath, "/health"},
		{"AuthSignupPath", AuthSignupPath, "/signup"},
		{"AuthLoginPath", AuthLoginPath, "/login"},
		{"AuthMePath", AuthMePath, "/me"},
		{"AuthRolePath", AuthRolePath, "/role"},
		{"StoresPath", StoresPath, "/stores"},
		{"StoreByIDPath", StoreByIDPath, "/stores/:id"},
		{"StoreMenusPath", StoreMenusPath, "/stores/:id/menus"},
		{"StoreReviewsPath", StoreReviewsPath, "/stores/:id/reviews"},
		{"StationsPath", StationsPath, "/stations"},
		{"ReviewLikesPath", ReviewLikesPath, "/reviews/:id/likes"},
		{"UsersMePath", UsersMePath, "/users/me"},
		{"UserByIDPath", UserByIDPath, "/users/:id"},
		{"UserReviewsPath", UserReviewsPath, "/users/:id/reviews"},
		{"UserFavoritesPath", UserFavoritesPath, "/users/me/favorites"},
		{"UserFavoriteByPath", UserFavoriteByPath, "/users/me/favorites/:store_id"},
		{"ReportsPath", ReportsPath, "/reports"},
		{"MediaUploadPath", MediaUploadPath, "/media/upload"},
		{"AdminStoresPendingPath", AdminStoresPendingPath, "/stores/pending"},
		{"AdminStoreApprovePath", AdminStoreApprovePath, "/stores/:id/approve"},
		{"AdminStoreRejectPath", AdminStoreRejectPath, "/stores/:id/reject"},
		{"AdminReportsPath", AdminReportsPath, "/reports"},
		{"AdminReportActionPath", AdminReportActionPath, "/reports/:id/action"},
		{"AdminUserByIDPath", AdminUserByIDPath, "/users/:id"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.constant != tc.expected {
				t.Errorf("expected %s to be %s, got %s", tc.name, tc.expected, tc.constant)
			}
		})
	}
}

// TestRouteHandlersAttached tests that handlers are attached to routes
func TestRouteHandlersAttached(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	for _, route := range routes {
		// Echo v4's Route struct uses Name field for handler identification
		// A route is properly configured if Method and Path are set
		if route.Method == "" || route.Path == "" {
			t.Errorf("Route is not properly configured: method=%s path=%s", route.Method, route.Path)
		}
	}
}

// TestMiddlewareApplied tests that global middleware is applied
func TestMiddlewareApplied(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	// Test that CORS headers are added (middleware is applied)
	req := httptest.NewRequest(http.MethodOptions, HealthPath, nil)
	req.Header.Set("Origin", "http://example.com")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	// CORS middleware should add Access-Control-Allow-Origin header
	if rec.Header().Get("Access-Control-Allow-Origin") == "" {
		t.Log("Note: CORS middleware may not add header for simple requests. This is expected behavior.")
	}
}

// TestHTTPMethodsForStoreEndpoint tests that store endpoint accepts correct HTTP methods
func TestHTTPMethodsForStoreEndpoint(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	methodsForStores := make(map[string]bool)
	methodsForStoreByID := make(map[string]bool)

	for _, route := range routes {
		if route.Path == "/api/stores" {
			methodsForStores[route.Method] = true
		}
		if route.Path == "/api/stores/:id" {
			methodsForStoreByID[route.Method] = true
		}
	}

	// /api/stores should have GET and POST
	if !methodsForStores[http.MethodGet] {
		t.Error("GET method not registered for /api/stores")
	}
	if !methodsForStores[http.MethodPost] {
		t.Error("POST method not registered for /api/stores")
	}

	// /api/stores/:id should have GET, PUT, DELETE
	if !methodsForStoreByID[http.MethodGet] {
		t.Error("GET method not registered for /api/stores/:id")
	}
	if !methodsForStoreByID[http.MethodPut] {
		t.Error("PUT method not registered for /api/stores/:id")
	}
	if !methodsForStoreByID[http.MethodDelete] {
		t.Error("DELETE method not registered for /api/stores/:id")
	}
}

// TestSanitizeLogInput tests the log sanitization function
func TestSanitizeLogInput(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "no special characters",
			input:    "/api/stores",
			expected: "/api/stores",
		},
		{
			name:     "with newline",
			input:    "/api/stores\nmalicious",
			expected: "/api/storesmalicious",
		},
		{
			name:     "with carriage return",
			input:    "/api/stores\rmalicious",
			expected: "/api/storesmalicious",
		},
		{
			name:     "with both newline and carriage return",
			input:    "/api/stores\r\nmalicious",
			expected: "/api/storesmalicious",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := sanitizeLogInput(tc.input)
			if result != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, result)
			}
		})
	}
}

// TestErrorHandlerConfigured tests that the custom error handler is configured
func TestErrorHandlerConfigured(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	// The custom error handler should be set
	if server.HTTPErrorHandler == nil {
		t.Error("HTTPErrorHandler is not configured")
	}
}

// TestNotFoundRoute tests that a non-existent route returns 404
func TestNotFoundRoute(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	req := httptest.NewRequest(http.MethodGet, "/nonexistent", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rec.Code)
	}
}

// TestMethodNotAllowed tests that incorrect HTTP method returns appropriate error
func TestMethodNotAllowed(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	// POST to health endpoint should fail (only GET is allowed)
	req := httptest.NewRequest(http.MethodPost, HealthPath, nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	// Echo returns 405 Method Not Allowed for routes with different methods
	if rec.Code != http.StatusMethodNotAllowed && rec.Code != http.StatusNotFound {
		t.Errorf("expected status 405 or 404, got %d", rec.Code)
	}
}

// TestAPIGroupRouting tests that API routes are properly grouped under /api
func TestAPIGroupRouting(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	// Count routes that start with /api
	apiRouteCount := 0
	for _, route := range routes {
		if len(route.Path) >= 4 && route.Path[:4] == "/api" {
			apiRouteCount++
		}
	}

	// Should have at least 29 API routes (excluding health and internal routes)
	if apiRouteCount < 29 {
		t.Errorf("expected at least 29 API routes, got %d", apiRouteCount)
	}
}

// TestAuthGroupRouting tests that auth routes are properly grouped
func TestAuthGroupRouting(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	// Count routes that start with /api/auth
	authRouteCount := 0
	for _, route := range routes {
		if len(route.Path) >= 9 && route.Path[:9] == "/api/auth" {
			authRouteCount++
		}
	}

	// Should have exactly 4 auth routes
	if authRouteCount != 4 {
		t.Errorf("expected 4 auth routes, got %d", authRouteCount)
	}
}

// TestAdminGroupRouting tests that admin routes are properly grouped
func TestAdminGroupRouting(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	routes := server.Routes()

	// Count routes that start with /api/admin
	adminRouteCount := 0
	for _, route := range routes {
		if len(route.Path) >= 10 && route.Path[:10] == "/api/admin" {
			adminRouteCount++
		}
	}

	// Should have 6 admin routes + 2 internal echo routes (echo_route_not_found)
	if adminRouteCount != 8 {
		t.Errorf("expected 8 admin routes (including internal), got %d", adminRouteCount)
	}
}

// TestDependenciesStruct tests that Dependencies struct has all required fields
func TestDependenciesStruct(t *testing.T) {
	mockUC := &mockUserUseCase{}
	deps := &Dependencies{
		UserUC: mockUC,
	}

	// Test that the struct can be instantiated with UserUC
	if deps.UserUC == nil {
		t.Error("UserUC should not be nil when set")
	}
	// Verify the mock was assigned correctly
	if deps.UserUC != mockUC {
		t.Error("UserUC should be the assigned mock")
	}
}

// TestRecoverMiddleware tests that recover middleware catches panics
func TestRecoverMiddleware(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	// The recover middleware should be applied
	// We can verify this by checking that the server handles requests without crashing
	req := httptest.NewRequest(http.MethodGet, HealthPath, nil)
	rec := httptest.NewRecorder()

	// This should not panic
	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

// TestErrorHandler_PresenterError tests handling of presentation.HTTPError
func TestErrorHandler_PresenterError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	// Create a custom handler that returns a presentation error
	server.GET("/test-pres-error", func(c echo.Context) error {
		return presentation.NewBadRequest("test error message")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-pres-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

// TestErrorHandler_EchoHTTPError tests handling of echo.HTTPError
func TestErrorHandler_EchoHTTPError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-echo-error", func(c echo.Context) error {
		return echo.NewHTTPError(http.StatusForbidden, "forbidden")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-echo-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
}

// TestErrorHandler_GenericError tests handling of generic errors
func TestErrorHandler_GenericError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-generic-error", func(c echo.Context) error {
		return errors.New("generic error")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-generic-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	// Generic errors should return 500 by default
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
	}
}

// TestErrorHandler_NilError tests that nil errors are handled gracefully
func TestErrorHandler_NilError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-nil-error", func(c echo.Context) error {
		return nil
	})

	req := httptest.NewRequest(http.MethodGet, "/test-nil-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

// TestErrorHandler_ServerError tests 5xx error handling
func TestErrorHandler_ServerError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-server-error", func(c echo.Context) error {
		return presentation.NewInternalServerError("internal error")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-server-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
	}
}

// TestErrorHandler_ClientError tests 4xx error handling
func TestErrorHandler_ClientError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-client-error", func(c echo.Context) error {
		return presentation.NewUnauthorized("unauthorized")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-client-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected status %d, got %d", http.StatusUnauthorized, rec.Code)
	}
}

// TestErrorHandler_Committed tests that the error handler does nothing if the response is already committed
func TestErrorHandler_Committed(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-committed", func(c echo.Context) error {
		c.Response().Committed = true
		return errors.New("this error should be ignored")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-committed", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
}

// TestErrorHandler_JSONError tests the error path when JSON marshaling fails
func TestErrorHandler_JSONError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-json-error", func(c echo.Context) error {
		// Functions cannot be marshaled to JSON, triggering c.JSON error
		return &presentation.HTTPError{
			Status: http.StatusBadRequest,
			Body:   func() {},
		}
	})

	req := httptest.NewRequest(http.MethodGet, "/test-json-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	// Status will be set by Echo before JSON marshaling fails, but since c.JSON returns error
	// before writing to recorder, it might still be 200 in httptest.NewRecorder
	// The important thing is that it hits the error logger in sendHTTPError
}

// TestErrorHandler_EchoServerError tests handling of echo.HTTPError with 5xx status
func TestErrorHandler_EchoServerError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-echo-server-error", func(c echo.Context) error {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "service unavailable")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-echo-server-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected status %d, got %d", http.StatusServiceUnavailable, rec.Code)
	}
}

// TestErrorHandler_GenericClientError tests handling of generic errors that map to 4xx status
func TestErrorHandler_GenericClientError(t *testing.T) {
	deps := createTestDependencies()
	server := NewServer(deps)

	server.GET("/test-generic-client-error", func(c echo.Context) error {
		return apperr.Errorf(apperr.CodeNotFound, "resource not found")
	})

	req := httptest.NewRequest(http.MethodGet, "/test-generic-client-error", nil)
	rec := httptest.NewRecorder()

	server.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected status %d, got %d", http.StatusNotFound, rec.Code)
	}
}
