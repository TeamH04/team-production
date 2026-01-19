package security_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
)

func TestTokenClaims_Fields(t *testing.T) {
	claims := security.TokenClaims{
		UserID:   "user-123",
		Role:     "admin",
		Email:    "test@example.com",
		Provider: "google",
		Name:     "Test User",
		IconURL:  "https://example.com/avatar.png",
		Gender:   "female",
	}

	if claims.UserID != "user-123" {
		t.Errorf("expected UserID 'user-123', got '%s'", claims.UserID)
	}
	if claims.Role != "admin" {
		t.Errorf("expected Role 'admin', got '%s'", claims.Role)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected Email 'test@example.com', got '%s'", claims.Email)
	}
	if claims.Provider != "google" {
		t.Errorf("expected Provider 'google', got '%s'", claims.Provider)
	}
	if claims.Name != "Test User" {
		t.Errorf("expected Name 'Test User', got '%s'", claims.Name)
	}
	if claims.IconURL != "https://example.com/avatar.png" {
		t.Errorf("expected IconURL 'https://example.com/avatar.png', got '%s'", claims.IconURL)
	}
	if claims.Gender != "female" {
		t.Errorf("expected Gender 'female', got '%s'", claims.Gender)
	}
}

func TestTokenClaims_EmptyFields(t *testing.T) {
	claims := security.TokenClaims{}

	if claims.UserID != "" {
		t.Errorf("expected empty UserID, got '%s'", claims.UserID)
	}
	if claims.Role != "" {
		t.Errorf("expected empty Role, got '%s'", claims.Role)
	}
	if claims.Email != "" {
		t.Errorf("expected empty Email, got '%s'", claims.Email)
	}
	if claims.Provider != "" {
		t.Errorf("expected empty Provider, got '%s'", claims.Provider)
	}
	if claims.Name != "" {
		t.Errorf("expected empty Name, got '%s'", claims.Name)
	}
	if claims.IconURL != "" {
		t.Errorf("expected empty IconURL, got '%s'", claims.IconURL)
	}
	if claims.Gender != "" {
		t.Errorf("expected empty Gender, got '%s'", claims.Gender)
	}
}

func TestTokenVerifier_Interface(t *testing.T) {
	// Test that MockTokenVerifier implements TokenVerifier interface
	var _ security.TokenVerifier = &testutil.MockTokenVerifier{}

	verifier := &testutil.MockTokenVerifier{
		Claims: &security.TokenClaims{
			UserID: "user-1",
			Role:   "user",
		},
	}

	claims, err := verifier.Verify(context.Background(), "test-token")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.UserID != "user-1" {
		t.Errorf("expected UserID 'user-1', got '%s'", claims.UserID)
	}
}

func TestTokenVerifier_WithError(t *testing.T) {
	expectedErr := errors.New("verification failed")
	verifier := &testutil.MockTokenVerifier{
		Err: expectedErr,
	}

	_, err := verifier.Verify(context.Background(), "invalid-token")
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !errors.Is(err, expectedErr) {
		t.Errorf("expected error %v, got %v", expectedErr, err)
	}
}

func TestExtractBearerToken(t *testing.T) {
	tests := []struct {
		name           string
		authHeader     string
		expectedToken  string
		expectedErrNil bool
	}{
		{
			name:           "empty header",
			authHeader:     "",
			expectedToken:  "",
			expectedErrNil: true,
		},
		{
			name:           "bearer token with prefix",
			authHeader:     "Bearer my-token-123",
			expectedToken:  "my-token-123",
			expectedErrNil: true,
		},
		{
			name:           "bearer token with spaces",
			authHeader:     "Bearer   my-token-with-spaces  ",
			expectedToken:  "my-token-with-spaces",
			expectedErrNil: true,
		},
		{
			name:           "plain token without prefix",
			authHeader:     "plain-token-456",
			expectedToken:  "plain-token-456",
			expectedErrNil: true,
		},
		{
			name:           "plain token with spaces",
			authHeader:     "  token-with-spaces  ",
			expectedToken:  "token-with-spaces",
			expectedErrNil: true,
		},
		{
			name:           "bearer prefix only",
			authHeader:     "Bearer ",
			expectedToken:  "",
			expectedErrNil: true,
		},
		{
			name:           "bearer prefix with only spaces",
			authHeader:     "Bearer    ",
			expectedToken:  "",
			expectedErrNil: true,
		},
		{
			name:           "lowercase bearer (not recognized as bearer)",
			authHeader:     "bearer my-token",
			expectedToken:  "bearer my-token",
			expectedErrNil: true,
		},
		{
			name:           "jwt-like token",
			authHeader:     "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature",
			expectedToken:  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature",
			expectedErrNil: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := security.ExtractBearerToken(tt.authHeader)

			if tt.expectedErrNil && err != nil {
				t.Errorf("expected no error, got %v", err)
			}
			if !tt.expectedErrNil && err == nil {
				t.Error("expected error, got nil")
			}
			if token != tt.expectedToken {
				t.Errorf("expected token %q, got %q", tt.expectedToken, token)
			}
		})
	}
}

func TestBearerPrefix(t *testing.T) {
	if security.BearerPrefix != "Bearer " {
		t.Errorf("expected BearerPrefix to be 'Bearer ', got %q", security.BearerPrefix)
	}
}
