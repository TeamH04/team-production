package supabase

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// Test constants
const (
	testRoleAdmin = "admin"
	testKeyID     = "test-key-id"
)

// assertTokenClaims verifies that the token claims match expected values.
func assertTokenClaims(t *testing.T, claims *security.TokenClaims, userID, email, roleStr, provider string) {
	t.Helper()
	assert.Equal(t, userID, claims.UserID, "UserID should match")
	assert.Equal(t, email, claims.Email, "Email should match")
	assert.Equal(t, roleStr, claims.Role, "Role should match")
	assert.Equal(t, provider, claims.Provider, "Provider should match")
}

// assertAuthUser verifies that the auth user matches expected values.
func assertAuthUser(t *testing.T, user *output.AuthUser, id, email, roleStr string) {
	t.Helper()
	assert.Equal(t, id, user.ID, "User ID should match")
	assert.Equal(t, email, user.Email, "Email should match")
	assert.Equal(t, roleStr, user.Role, "Role should match")
}

// assertAuthSession verifies that the auth session matches expected values.
func assertAuthSession(t *testing.T, session *output.AuthSession, accessToken, refreshToken, tokenType string, expiresIn int) {
	t.Helper()
	assert.Equal(t, accessToken, session.AccessToken, "AccessToken should match")
	assert.Equal(t, refreshToken, session.RefreshToken, "RefreshToken should match")
	assert.Equal(t, tokenType, session.TokenType, "TokenType should match")
	assert.Equal(t, expiresIn, session.ExpiresIn, "ExpiresIn should match")
}

// assertSignedUpload verifies that the signed upload matches expected values.
func assertSignedUpload(t *testing.T, result *output.SignedUpload, bucket, path, token, contentType string, expiresIn time.Duration, upsert bool) {
	t.Helper()
	assert.Equal(t, bucket, result.Bucket, "Bucket should match")
	assert.Equal(t, path, result.Path, "Path should match")
	assert.Equal(t, token, result.Token, "Token should match")
	assert.Equal(t, contentType, result.ContentType, "ContentType should match")
	assert.Equal(t, expiresIn, result.ExpiresIn, "ExpiresIn should match")
	assert.Equal(t, upsert, result.Upsert, "Upsert should match")
}

// assertSignedDownload verifies that the signed download matches expected values.
func assertSignedDownload(t *testing.T, result *output.SignedDownload, bucket, path, url string, expiresIn time.Duration) {
	t.Helper()
	assert.Equal(t, bucket, result.Bucket, "Bucket should match")
	assert.Equal(t, path, result.Path, "Path should match")
	assert.Equal(t, url, result.URL, "URL should match")
	assert.Equal(t, expiresIn, result.ExpiresIn, "ExpiresIn should match")
}

// requireErrorContains asserts that an error is not nil and contains the expected substring.
func requireErrorContains(t *testing.T, err error, contains string) {
	t.Helper()
	require.Error(t, err)
	assert.Contains(t, err.Error(), contains)
}

// setupTestServer creates a test server with the given handler and returns the server and a configured client.
func setupTestServer(t *testing.T, handler http.HandlerFunc) (*httptest.Server, *Client) {
	t.Helper()
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)
	client := NewClient(server.URL, "anon-key", "service-key")
	return server, client
}

// setupJWKSServer creates a test server that serves JWKS for token verification.
func setupJWKSServer(t *testing.T, kid, xB64, yB64 string) (*httptest.Server, *Client) {
	t.Helper()
	handler := func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/auth/v1/.well-known/jwks.json" {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"keys": []map[string]string{
					{"kty": "EC", "crv": "P-256", "kid": kid, "x": xB64, "y": yB64},
				},
			})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}
	return setupTestServer(t, handler)
}

// writeJSON is a test helper that encodes data as JSON and writes to the response writer.
// Error checking is intentionally omitted since this is test code and failures
// will be caught by test assertions.
//
//nolint:errcheck
func writeJSON(w http.ResponseWriter, data interface{}) {
	_ = json.NewEncoder(w).Encode(data)
}

// writeBytes is a test helper that writes bytes to the response writer.
//
//nolint:errcheck
func writeBytes(w http.ResponseWriter, data []byte) {
	_, _ = w.Write(data)
}

// TestNewClient tests the NewClient constructor.
func TestNewClient(t *testing.T) {
	tests := []struct {
		name       string
		baseURL    string
		anonKey    string
		serviceKey string
		wantURL    string
		wantAnon   string
		wantSvc    string
	}{
		{
			name:       "valid config",
			baseURL:    "https://example.supabase.co",
			anonKey:    "anon-key",
			serviceKey: "service-key",
			wantURL:    "https://example.supabase.co",
			wantAnon:   "anon-key",
			wantSvc:    "service-key",
		},
		{
			name:       "trims trailing slash",
			baseURL:    "https://example.supabase.co/",
			anonKey:    "anon-key",
			serviceKey: "service-key",
			wantURL:    "https://example.supabase.co",
			wantAnon:   "anon-key",
			wantSvc:    "service-key",
		},
		{
			name:       "trims whitespace",
			baseURL:    "  https://example.supabase.co  ",
			anonKey:    "  anon-key  ",
			serviceKey: "  service-key  ",
			wantURL:    "https://example.supabase.co",
			wantAnon:   "anon-key",
			wantSvc:    "service-key",
		},
		{
			name:       "empty values",
			baseURL:    "",
			anonKey:    "",
			serviceKey: "",
			wantURL:    "",
			wantAnon:   "",
			wantSvc:    "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient(tt.baseURL, tt.anonKey, tt.serviceKey)
			assert.Equal(t, tt.wantURL, client.baseURL)
			assert.Equal(t, tt.wantAnon, client.anonKey)
			assert.Equal(t, tt.wantSvc, client.serviceKey)
			assert.NotNil(t, client.httpClient)
		})
	}
}

// TestClient_ImplementsInterfaces verifies that Client implements all required interfaces.
func TestClient_ImplementsInterfaces(t *testing.T) {
	var _ output.AuthProvider = &Client{}
	var _ output.StorageProvider = &Client{}
	var _ security.TokenVerifier = &Client{}
}

// TestClient_Signup tests the Signup method.
func TestClient_Signup(t *testing.T) {
	t.Run("successful signup", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Contains(t, r.URL.Path, "/auth/v1/admin/users")
			assert.Equal(t, "application/json", r.Header.Get("Content-Type"))
			assert.NotEmpty(t, r.Header.Get("apikey"))
			assert.NotEmpty(t, r.Header.Get("Authorization"))

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"id":    "user-123",
				"email": "test@example.com",
				"app_metadata": map[string]string{
					"role": testRoleAdmin,
				},
			})
		})

		result, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "Test User",
		})

		require.NoError(t, err)
		assertAuthUser(t, result, "user-123", "test@example.com", testRoleAdmin)
	})

	t.Run("successful signup with default role", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"id":           "user-456",
				"email":        "user@example.com",
				"app_metadata": map[string]string{},
			})
		})

		result, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email:    "user@example.com",
			Password: "password",
			Name:     "User",
		})

		require.NoError(t, err)
		assert.Equal(t, role.User, result.Role)
	})

	t.Run("signup error - email exists", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			writeJSON(w, map[string]string{"message": "User already registered"})
		})

		_, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email:    "existing@example.com",
			Password: "password",
			Name:     "Existing User",
		})

		requireErrorContains(t, err, "User already registered")
	})

	t.Run("server error", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			writeJSON(w, map[string]string{"error": "Internal server error"})
		})

		_, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email:    "test@example.com",
			Password: "password",
			Name:     "Test",
		})

		requireErrorContains(t, err, "Internal server error")
	})

	t.Run("server error with empty body", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			writeBytes(w, []byte("{}"))
		})

		_, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email:    "test@example.com",
			Password: "password",
			Name:     "Test",
		})

		requireErrorContains(t, err, "status 500")
	})
}

// TestClient_Signup_NotConfigured tests Signup with missing configuration.
func TestClient_Signup_NotConfigured(t *testing.T) {
	tests := []struct {
		name       string
		baseURL    string
		serviceKey string
	}{
		{name: "empty baseURL", baseURL: "", serviceKey: "key"},
		{name: "empty serviceKey", baseURL: "http://localhost", serviceKey: ""},
		{name: "both empty", baseURL: "", serviceKey: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient(tt.baseURL, "", tt.serviceKey)
			_, err := client.Signup(context.Background(), output.AuthSignupInput{})
			requireErrorContains(t, err, "not configured")
		})
	}
}

// TestClient_Login tests the Login method.
func TestClient_Login(t *testing.T) {
	t.Run("successful login", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Contains(t, r.URL.String(), "grant_type=password")

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"access_token":  "access-token-123",
				"refresh_token": "refresh-token-456",
				"token_type":    "bearer",
				"expires_in":    3600,
				"user": map[string]interface{}{
					"id":           "user-789",
					"email":        "user@example.com",
					"app_metadata": map[string]string{"role": "owner"},
				},
			})
		})

		result, err := client.Login(context.Background(), output.AuthLoginInput{
			Email:    "user@example.com",
			Password: "password123",
		})

		require.NoError(t, err)
		assertAuthSession(t, result, "access-token-123", "refresh-token-456", "bearer", 3600)
		assertAuthUser(t, &result.User, "user-789", "user@example.com", "owner")
	})

	t.Run("login with user_metadata role", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"access_token":  "token",
				"refresh_token": "refresh",
				"token_type":    "bearer",
				"expires_in":    3600,
				"user": map[string]interface{}{
					"id":            "user-id",
					"email":         "user@example.com",
					"app_metadata":  map[string]string{},
					"user_metadata": map[string]string{"role": testRoleAdmin},
				},
			})
		})

		result, err := client.Login(context.Background(), output.AuthLoginInput{Email: "user@example.com", Password: "pass"})

		require.NoError(t, err)
		assert.Equal(t, testRoleAdmin, result.User.Role)
	})

	t.Run("login with default role", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"access_token":  "token",
				"refresh_token": "refresh",
				"token_type":    "bearer",
				"expires_in":    3600,
				"user": map[string]interface{}{
					"id":    "user-id",
					"email": "user@example.com",
				},
			})
		})

		result, err := client.Login(context.Background(), output.AuthLoginInput{Email: "user@example.com", Password: "pass"})

		require.NoError(t, err)
		assert.Equal(t, role.User, result.User.Role)
	})

	t.Run("invalid credentials", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			writeJSON(w, map[string]string{"message": "Invalid login credentials"})
		})

		_, err := client.Login(context.Background(), output.AuthLoginInput{
			Email:    "wrong@example.com",
			Password: "wrong",
		})

		requireErrorContains(t, err, "Invalid login credentials")
	})

	t.Run("unauthorized", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			writeJSON(w, map[string]string{"error": "Unauthorized"})
		})

		_, err := client.Login(context.Background(), output.AuthLoginInput{Email: "test@example.com", Password: "pass"})

		requireErrorContains(t, err, "Unauthorized")
	})
}

// TestClient_Login_NotConfigured tests Login with missing configuration.
func TestClient_Login_NotConfigured(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		anonKey string
	}{
		{name: "empty baseURL", baseURL: "", anonKey: "key"},
		{name: "empty anonKey", baseURL: "http://localhost", anonKey: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient(tt.baseURL, tt.anonKey, "")
			_, err := client.Login(context.Background(), output.AuthLoginInput{})
			requireErrorContains(t, err, "not configured")
		})
	}
}

// TestClient_CreateSignedUpload tests the CreateSignedUpload method.
func TestClient_CreateSignedUpload(t *testing.T) {
	t.Run("successful signed upload", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Contains(t, r.URL.Path, "/storage/v1/object/upload/sign/test-bucket/")

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"token": "signed-token-123",
				"path":  "images/test.png",
			})
		})

		result, err := client.CreateSignedUpload(context.Background(), "test-bucket", "images/test.png", "image/png", time.Hour, false)

		require.NoError(t, err)
		assertSignedUpload(t, result, "test-bucket", "images/test.png", "signed-token-123", "image/png", time.Hour, false)
	})

	t.Run("signed upload with upsert", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			var payload map[string]interface{}
			err := json.NewDecoder(r.Body).Decode(&payload)
			require.NoError(t, err)
			assert.Equal(t, true, payload["upsert"])

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{"token": "token"})
		})

		result, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", time.Minute*30, true)

		require.NoError(t, err)
		assert.True(t, result.Upsert)
	})

	t.Run("url encodes path segments with spaces", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.RequestURI, "my%20folder")
			assert.Contains(t, r.RequestURI, "my%20file.png")

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{"token": "token"})
		})

		_, err := client.CreateSignedUpload(context.Background(), "bucket", "my folder/my file.png", "image/png", time.Hour, false)
		require.NoError(t, err)
	})

	t.Run("empty bucket", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedUpload(context.Background(), "", "file.txt", "text/plain", time.Hour, false)
		requireErrorContains(t, err, "bucket is required")
	})

	t.Run("empty objectPath", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedUpload(context.Background(), "bucket", "", "text/plain", time.Hour, false)
		requireErrorContains(t, err, "objectPath is required")
	})

	t.Run("negative expiresIn", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", -time.Hour, false)
		requireErrorContains(t, err, "expiresIn must be positive")
	})

	t.Run("zero expiresIn", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", 0, false)
		requireErrorContains(t, err, "expiresIn must be positive")
	})

	t.Run("missing token in response", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{"path": "file.txt"})
		})

		_, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", time.Hour, false)
		requireErrorContains(t, err, "missing token")
	})

	t.Run("server error", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			writeJSON(w, map[string]string{"message": "Storage error"})
		})

		_, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", time.Hour, false)
		requireErrorContains(t, err, "Storage error")
	})

	t.Run("forbidden", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusForbidden)
			writeJSON(w, map[string]string{"message": "Access denied to bucket"})
		})

		_, err := client.CreateSignedUpload(context.Background(), "bucket", "file.txt", "text/plain", time.Hour, false)
		requireErrorContains(t, err, "Access denied")
	})
}

// TestClient_CreateSignedUpload_NotConfigured tests CreateSignedUpload with missing configuration.
func TestClient_CreateSignedUpload_NotConfigured(t *testing.T) {
	client := NewClient("", "", "")
	_, err := client.CreateSignedUpload(context.Background(), "bucket", "path", "text/plain", time.Hour, false)
	requireErrorContains(t, err, "not configured")
}

// TestClient_CreateSignedDownload tests the CreateSignedDownload method.
func TestClient_CreateSignedDownload(t *testing.T) {
	t.Run("successful signed download", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Contains(t, r.URL.Path, "/storage/v1/object/sign/test-bucket/")

			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"signedURL": "https://storage.example.com/signed/test-file?token=abc",
			})
		})

		result, err := client.CreateSignedDownload(context.Background(), "test-bucket", "images/test.png", time.Hour)

		require.NoError(t, err)
		assertSignedDownload(t, result, "test-bucket", "images/test.png", "https://storage.example.com/signed/test-file?token=abc", time.Hour)
	})

	t.Run("signed download with relative URL", func(t *testing.T) {
		server, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"signedURL": "/object/sign/bucket/file.txt?token=xyz",
			})
		})

		result, err := client.CreateSignedDownload(context.Background(), "bucket", "file.txt", time.Minute*30)

		require.NoError(t, err)
		expectedURL := server.URL + "/storage/v1/object/sign/bucket/file.txt?token=xyz"
		assert.Equal(t, expectedURL, result.URL)
	})

	t.Run("empty bucket", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedDownload(context.Background(), "", "file.txt", time.Hour)
		requireErrorContains(t, err, "bucket is required")
	})

	t.Run("empty objectPath", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedDownload(context.Background(), "bucket", "", time.Hour)
		requireErrorContains(t, err, "objectPath is required")
	})

	t.Run("negative expiresIn", func(t *testing.T) {
		client := NewClient("http://localhost", "anon-key", "service-key")
		_, err := client.CreateSignedDownload(context.Background(), "bucket", "file.txt", -time.Hour)
		requireErrorContains(t, err, "expiresIn must be positive")
	})

	t.Run("missing signedURL in response", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{"path": "file.txt"})
		})

		_, err := client.CreateSignedDownload(context.Background(), "bucket", "file.txt", time.Hour)
		requireErrorContains(t, err, "missing url")
	})

	t.Run("server error", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
			writeJSON(w, map[string]string{"message": "Storage unavailable"})
		})

		_, err := client.CreateSignedDownload(context.Background(), "bucket", "file.txt", time.Hour)
		requireErrorContains(t, err, "Storage unavailable")
	})

	t.Run("not found", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNotFound)
			writeJSON(w, map[string]string{"message": "Object not found"})
		})

		_, err := client.CreateSignedDownload(context.Background(), "bucket", "nonexistent.txt", time.Hour)
		requireErrorContains(t, err, "Object not found")
	})
}

// TestClient_CreateSignedDownload_NotConfigured tests CreateSignedDownload with missing configuration.
func TestClient_CreateSignedDownload_NotConfigured(t *testing.T) {
	client := NewClient("", "", "")
	_, err := client.CreateSignedDownload(context.Background(), "bucket", "path", time.Hour)
	requireErrorContains(t, err, "not configured")
}

// generateTestKey generates a P-256 ECDSA key pair for testing.
func generateTestKey() (*ecdsa.PrivateKey, string, string, error) {
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, "", "", err
	}

	xBytes := privateKey.PublicKey.X.Bytes()
	yBytes := privateKey.PublicKey.Y.Bytes()

	// Pad to 32 bytes if necessary
	for len(xBytes) < 32 {
		xBytes = append([]byte{0}, xBytes...)
	}
	for len(yBytes) < 32 {
		yBytes = append([]byte{0}, yBytes...)
	}

	xB64 := base64.RawURLEncoding.EncodeToString(xBytes)
	yB64 := base64.RawURLEncoding.EncodeToString(yBytes)

	return privateKey, xB64, yB64, nil
}

// createTestToken creates a signed JWT for testing.
func createTestToken(privateKey *ecdsa.PrivateKey, kid string, claims jwt.MapClaims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
	token.Header["kid"] = kid

	return token.SignedString(privateKey)
}

// TestClient_Verify tests the Verify method with real JWT signing.
func TestClient_Verify(t *testing.T) {
	privateKey, xB64, yB64, err := generateTestKey()
	require.NoError(t, err, "failed to generate test key")

	kid := testKeyID

	t.Run("successful verification", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub":          "user-123",
			"email":        "test@example.com",
			"role":         testRoleAdmin,
			"exp":          time.Now().Add(time.Hour).Unix(),
			"app_metadata": map[string]interface{}{"provider": "google"},
		})
		require.NoError(t, err)

		claims, err := client.Verify(context.Background(), tokenStr)
		require.NoError(t, err)
		assertTokenClaims(t, claims, "user-123", "test@example.com", testRoleAdmin, "google")
	})

	t.Run("provider from user_metadata", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub":           "user-123",
			"exp":           time.Now().Add(time.Hour).Unix(),
			"user_metadata": map[string]interface{}{"provider": "github"},
		})
		require.NoError(t, err)

		claims, err := client.Verify(context.Background(), tokenStr)
		require.NoError(t, err)
		assert.Equal(t, "github", claims.Provider)
	})

	t.Run("provider from providers array", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub":          "user-123",
			"exp":          time.Now().Add(time.Hour).Unix(),
			"app_metadata": map[string]interface{}{"providers": []interface{}{"apple", "google"}},
		})
		require.NoError(t, err)

		claims, err := client.Verify(context.Background(), tokenStr)
		require.NoError(t, err)
		assert.Equal(t, "apple", claims.Provider)
	})

	t.Run("default role when not specified", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		claims, err := client.Verify(context.Background(), tokenStr)
		require.NoError(t, err)
		assert.Equal(t, role.User, claims.Role)
	})

	t.Run("default provider when not specified", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		claims, err := client.Verify(context.Background(), tokenStr)
		require.NoError(t, err)
		assert.Equal(t, "oauth", claims.Provider)
	})

	t.Run("expired token", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(-time.Hour).Unix(),
		})
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		requireErrorContains(t, err, "token")
	})

	t.Run("missing sub claim", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"email": "test@example.com",
			"exp":   time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		requireErrorContains(t, err, "sub")
	})

	t.Run("invalid signing method", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		tokenStr, err := token.SignedString([]byte("secret"))
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		require.Error(t, err)
	})

	t.Run("JWKS fetch error", func(t *testing.T) {
		_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		})

		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		require.Error(t, err)
	})

	t.Run("unknown key ID", func(t *testing.T) {
		_, client := setupJWKSServer(t, kid, xB64, yB64)

		tokenStr, err := createTestToken(privateKey, "unknown-kid", jwt.MapClaims{
			"sub": "user-123",
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		requireErrorContains(t, err, "kid")
	})
}

// TestClient_Verify_NotConfigured tests Verify with missing configuration.
func TestClient_Verify_NotConfigured(t *testing.T) {
	client := NewClient("", "anon-key", "service-key")
	_, err := client.Verify(context.Background(), "some-token")
	requireErrorContains(t, err, "not configured")
}

// TestClient_Verify_InvalidToken tests Verify with malformed tokens.
func TestClient_Verify_InvalidToken(t *testing.T) {
	_, xB64, yB64, err := generateTestKey()
	require.NoError(t, err)

	tests := []struct {
		name        string
		token       string
		errContains string
	}{
		{name: "empty token", token: "", errContains: "token"},
		{name: "malformed token", token: "not.a.valid.jwt", errContains: "token"},
		{name: "missing kid header", token: "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.invalid", errContains: "kid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, client := setupJWKSServer(t, testKeyID, xB64, yB64)
			_, err := client.Verify(context.Background(), tt.token)
			requireErrorContains(t, err, tt.errContains)
		})
	}
}

// TestClient_JWKS_Caching tests that JWKS is cached properly.
func TestClient_JWKS_Caching(t *testing.T) {
	privateKey, xB64, yB64, err := generateTestKey()
	require.NoError(t, err)

	kid := testKeyID
	fetchCount := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/auth/v1/.well-known/jwks.json" {
			fetchCount++
			w.Header().Set("Content-Type", "application/json")
			writeJSON(w, map[string]interface{}{
				"keys": []map[string]string{
					{"kty": "EC", "crv": "P-256", "kid": kid, "x": xB64, "y": yB64},
				},
			})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	t.Cleanup(server.Close)

	client := NewClient(server.URL, "anon-key", "service-key")

	for i := 0; i < 3; i++ {
		tokenStr, err := createTestToken(privateKey, kid, jwt.MapClaims{
			"sub": fmt.Sprintf("user-%d", i),
			"exp": time.Now().Add(time.Hour).Unix(),
		})
		require.NoError(t, err)

		_, err = client.Verify(context.Background(), tokenStr)
		require.NoError(t, err, "unexpected error on call %d", i)
	}

	assert.Equal(t, 1, fetchCount, "JWKS should only be fetched once due to caching")
}

// TestEscapePathPreserveSlash tests the path escaping function.
func TestEscapePathPreserveSlash(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{input: "simple/path", expected: "simple/path"},
		{input: "/leading/slash", expected: "leading/slash"},
		{input: "path with spaces/file name.txt", expected: "path%20with%20spaces/file%20name.txt"},
		{input: "special/chars!@#.txt", expected: "special/chars%21@%23.txt"},
		{input: "", expected: ""},
		{input: "  ", expected: ""},
		{input: "  /trimmed/path  ", expected: "trimmed/path"},
		{input: "a/b/c/d/e", expected: "a/b/c/d/e"},
		{input: "日本語/ファイル.txt", expected: "%E6%97%A5%E6%9C%AC%E8%AA%9E/%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB.txt"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := escapePathPreserveSlash(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestEnsureLeadingSlash tests the ensureLeadingSlash function.
func TestEnsureLeadingSlash(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{input: "/already/has/slash", expected: "/already/has/slash"},
		{input: "no/leading/slash", expected: "/no/leading/slash"},
		{input: "", expected: "/"},
		{input: "/", expected: "/"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := ensureLeadingSlash(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestSupabaseError tests the supabaseError type.
func TestSupabaseError(t *testing.T) {
	tests := []struct {
		name     string
		err      supabaseError
		expected string
	}{
		{name: "message field", err: supabaseError{Message: "Error message"}, expected: "Error message"},
		{name: "error field", err: supabaseError{Err: "Error from err field"}, expected: "Error from err field"},
		{name: "message takes precedence", err: supabaseError{Message: "Message", Err: "Error"}, expected: "Message"},
		{name: "empty fields", err: supabaseError{}, expected: "supabase error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.err.Error())
		})
	}
}

// TestDecodeSupabaseErrorFromBody tests error decoding from response bodies.
func TestDecodeSupabaseErrorFromBody(t *testing.T) {
	tests := []struct {
		name        string
		status      int
		body        []byte
		errContains string
	}{
		{name: "valid error with message", status: 400, body: []byte(`{"message": "Bad request"}`), errContains: "Bad request"},
		{name: "valid error with error field", status: 401, body: []byte(`{"error": "Unauthorized"}`), errContains: "Unauthorized"},
		{name: "invalid JSON", status: 500, body: []byte(`not json`), errContains: "status 500"},
		{name: "empty object", status: 403, body: []byte(`{}`), errContains: "status 403"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := decodeSupabaseErrorFromBody(tt.status, tt.body)
			requireErrorContains(t, err, tt.errContains)
		})
	}
}

// TestClient_StorageKey tests the storageKey method.
func TestClient_StorageKey(t *testing.T) {
	tests := []struct {
		name       string
		serviceKey string
		anonKey    string
		expected   string
	}{
		{name: "prefers service key", serviceKey: "service", anonKey: "anon", expected: "service"},
		{name: "falls back to anon key", serviceKey: "", anonKey: "anon", expected: "anon"},
		{name: "whitespace service key falls back", serviceKey: "   ", anonKey: "anon", expected: "anon"},
		{name: "both empty", serviceKey: "", anonKey: "", expected: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient("http://example.com", tt.anonKey, tt.serviceKey)
			assert.Equal(t, tt.expected, client.storageKey())
		})
	}
}

// TestClient_AuthKey tests the authKey method.
func TestClient_AuthKey(t *testing.T) {
	tests := []struct {
		name       string
		anonKey    string
		serviceKey string
		expected   string
	}{
		{name: "prefers anon key", anonKey: "anon", serviceKey: "service", expected: "anon"},
		{name: "falls back to service key", anonKey: "", serviceKey: "service", expected: "service"},
		{name: "whitespace anon key falls back", anonKey: "   ", serviceKey: "service", expected: "service"},
		{name: "both empty", anonKey: "", serviceKey: "", expected: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client := NewClient("http://example.com", tt.anonKey, tt.serviceKey)
			assert.Equal(t, tt.expected, client.authKey())
		})
	}
}

// TestJwkP256ToPublicKey tests the JWK to ECDSA public key conversion.
func TestJwkP256ToPublicKey(t *testing.T) {
	t.Run("valid key", func(t *testing.T) {
		privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
		require.NoError(t, err)

		xBytes := privateKey.PublicKey.X.Bytes()
		yBytes := privateKey.PublicKey.Y.Bytes()

		for len(xBytes) < 32 {
			xBytes = append([]byte{0}, xBytes...)
		}
		for len(yBytes) < 32 {
			yBytes = append([]byte{0}, yBytes...)
		}

		xB64 := base64.RawURLEncoding.EncodeToString(xBytes)
		yB64 := base64.RawURLEncoding.EncodeToString(yBytes)

		pubKey, err := jwkP256ToPublicKey(xB64, yB64)
		require.NoError(t, err)
		assert.Equal(t, 0, pubKey.X.Cmp(privateKey.PublicKey.X), "X coordinate mismatch")
		assert.Equal(t, 0, pubKey.Y.Cmp(privateKey.PublicKey.Y), "Y coordinate mismatch")
	})

	t.Run("invalid x base64", func(t *testing.T) {
		_, err := jwkP256ToPublicKey("not-valid-base64!!!", "AAAA")
		require.Error(t, err)
	})

	t.Run("invalid y base64", func(t *testing.T) {
		_, err := jwkP256ToPublicKey("AAAA", "not-valid-base64!!!")
		require.Error(t, err)
	})

	t.Run("invalid point on curve", func(t *testing.T) {
		xB64 := base64.RawURLEncoding.EncodeToString([]byte{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32})
		yB64 := base64.RawURLEncoding.EncodeToString([]byte{32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1})

		_, err := jwkP256ToPublicKey(xB64, yB64)
		require.Error(t, err)
	})
}

// TestGetStringFromMap tests the helper function.
func TestGetStringFromMap(t *testing.T) {
	tests := []struct {
		name     string
		values   map[string]any
		key      string
		expected string
	}{
		{name: "nil map", values: nil, key: "key", expected: ""},
		{name: "key not found", values: map[string]any{"other": "value"}, key: "key", expected: ""},
		{name: "string value", values: map[string]any{"key": "VALUE"}, key: "key", expected: "VALUE"},
		{name: "non-string value", values: map[string]any{"key": 123}, key: "key", expected: ""},
		{name: "whitespace trimmed", values: map[string]any{"key": "  GOOGLE  "}, key: "key", expected: "GOOGLE"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, getStringFromMap(tt.values, tt.key))
		})
	}
}

// TestGetStringSliceFromMap tests the helper function.
func TestGetStringSliceFromMap(t *testing.T) {
	tests := []struct {
		name     string
		values   map[string]any
		key      string
		expected []string
	}{
		{name: "nil map", values: nil, key: "key", expected: nil},
		{name: "key not found", values: map[string]any{"other": []any{"a"}}, key: "key", expected: nil},
		{name: "valid slice", values: map[string]any{"providers": []any{"google", "github"}}, key: "providers", expected: []string{"google", "github"}},
		{name: "not a slice", values: map[string]any{"providers": "google"}, key: "providers", expected: nil},
		{name: "filters non-strings", values: map[string]any{"providers": []any{"google", 123, "github"}}, key: "providers", expected: []string{"google", "github"}},
		{name: "filters empty strings", values: map[string]any{"providers": []any{"google", "", "  ", "github"}}, key: "providers", expected: []string{"google", "github"}},
		{name: "normalizes case and whitespace", values: map[string]any{"providers": []any{"  GOOGLE  ", "GitHub"}}, key: "providers", expected: []string{"google", "github"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, getStringSliceFromMap(tt.values, tt.key))
		})
	}
}

// TestExtractProvider tests the extractProvider function.
func TestExtractProvider(t *testing.T) {
	tests := []struct {
		name     string
		claims   *supabaseClaims
		expected string
	}{
		{name: "nil claims", claims: nil, expected: ""},
		{name: "provider from app_metadata", claims: &supabaseClaims{AppMetadata: map[string]any{"provider": "google"}}, expected: "google"},
		{name: "provider from user_metadata", claims: &supabaseClaims{UserMetadata: map[string]any{"provider": "github"}}, expected: "github"},
		{name: "providers array", claims: &supabaseClaims{AppMetadata: map[string]any{"providers": []any{"apple", "google"}}}, expected: "apple"},
		{name: "app_metadata takes precedence", claims: &supabaseClaims{AppMetadata: map[string]any{"provider": "google"}, UserMetadata: map[string]any{"provider": "github"}}, expected: "google"},
		{name: "no provider info", claims: &supabaseClaims{}, expected: ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.expected, extractProvider(tt.claims))
		})
	}
}

// TestClient_NetworkError tests network error handling.
func TestClient_NetworkError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {}))
	serverURL := server.URL
	server.Close()

	client := NewClient(serverURL, "anon-key", "service-key")

	t.Run("Signup network error", func(t *testing.T) {
		_, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email: "test@example.com", Password: "password", Name: "Test",
		})
		require.Error(t, err)
	})

	t.Run("Login network error", func(t *testing.T) {
		_, err := client.Login(context.Background(), output.AuthLoginInput{
			Email: "test@example.com", Password: "password",
		})
		require.Error(t, err)
	})

	t.Run("CreateSignedUpload network error", func(t *testing.T) {
		_, err := client.CreateSignedUpload(context.Background(), "bucket", "path", "text/plain", time.Hour, false)
		require.Error(t, err)
	})

	t.Run("CreateSignedDownload network error", func(t *testing.T) {
		_, err := client.CreateSignedDownload(context.Background(), "bucket", "path", time.Hour)
		require.Error(t, err)
	})
}

// TestClient_InvalidJSON tests handling of invalid JSON responses.
func TestClient_InvalidJSON(t *testing.T) {
	_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		writeBytes(w, []byte(`{invalid json`))
	})

	t.Run("Signup invalid JSON", func(t *testing.T) {
		_, err := client.Signup(context.Background(), output.AuthSignupInput{
			Email: "test@example.com", Password: "password", Name: "Test",
		})
		require.Error(t, err)
	})

	t.Run("Login invalid JSON", func(t *testing.T) {
		_, err := client.Login(context.Background(), output.AuthLoginInput{
			Email: "test@example.com", Password: "password",
		})
		require.Error(t, err)
	})

	t.Run("CreateSignedUpload invalid JSON", func(t *testing.T) {
		_, err := client.CreateSignedUpload(context.Background(), "bucket", "path", "text/plain", time.Hour, false)
		require.Error(t, err)
	})

	t.Run("CreateSignedDownload invalid JSON", func(t *testing.T) {
		_, err := client.CreateSignedDownload(context.Background(), "bucket", "path", time.Hour)
		require.Error(t, err)
	})
}

// TestClient_JWKS_NoUsableKeys tests JWKS response with no usable keys.
func TestClient_JWKS_NoUsableKeys(t *testing.T) {
	_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		writeJSON(w, map[string]interface{}{
			"keys": []map[string]string{{"kty": "RSA", "kid": "rsa-key"}},
		})
	})

	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	require.NoError(t, err)

	tokenStr, err := createTestToken(privateKey, "test-kid", jwt.MapClaims{
		"sub": "user-123",
		"exp": time.Now().Add(time.Hour).Unix(),
	})
	require.NoError(t, err)

	_, err = client.Verify(context.Background(), tokenStr)
	requireErrorContains(t, err, "no usable")
}

// TestClient_JWKS_EmptyKeys tests JWKS with missing key fields.
func TestClient_JWKS_EmptyKeys(t *testing.T) {
	tests := []struct {
		name string
		key  map[string]string
	}{
		{name: "missing kid", key: map[string]string{"kty": "EC", "crv": "P-256", "x": "AAAA", "y": "BBBB"}},
		{name: "missing x", key: map[string]string{"kty": "EC", "crv": "P-256", "kid": "key1", "y": "BBBB"}},
		{name: "missing y", key: map[string]string{"kty": "EC", "crv": "P-256", "kid": "key1", "x": "AAAA"}},
		{name: "wrong curve", key: map[string]string{"kty": "EC", "crv": "P-384", "kid": "key1", "x": "AAAA", "y": "BBBB"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, client := setupTestServer(t, func(w http.ResponseWriter, _ *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				writeJSON(w, map[string]interface{}{"keys": []map[string]string{tt.key}})
			})

			privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
			require.NoError(t, err)

			tokenStr, err := createTestToken(privateKey, "test-kid", jwt.MapClaims{
				"sub": "user-123",
				"exp": time.Now().Add(time.Hour).Unix(),
			})
			require.NoError(t, err)

			_, verifyErr := client.Verify(context.Background(), tokenStr)
			require.Error(t, verifyErr)
		})
	}
}

// TestClient_ContextCancellation tests context cancellation handling.
func TestClient_ContextCancellation(t *testing.T) {
	_, client := setupTestServer(t, func(_ http.ResponseWriter, _ *http.Request) {
		time.Sleep(500 * time.Millisecond)
	})

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	t.Run("Signup context cancellation", func(t *testing.T) {
		_, err := client.Signup(ctx, output.AuthSignupInput{
			Email: "test@example.com", Password: "password", Name: "Test",
		})
		require.Error(t, err)
	})
}
