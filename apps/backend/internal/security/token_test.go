package security_test

import (
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/security"
)

func TestTokenClaims_Fields(t *testing.T) {
	claims := security.TokenClaims{
		UserID:   "user-123",
		Role:     "admin",
		Email:    "test@example.com",
		Provider: "google",
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
}

// MockTokenVerifier implements security.TokenVerifier for testing
type mockTokenVerifier struct {
	claims *security.TokenClaims
	err    error
}

func (m *mockTokenVerifier) Verify(token string) (*security.TokenClaims, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.claims, nil
}

func TestTokenVerifier_Interface(t *testing.T) {
	// Test that mockTokenVerifier implements TokenVerifier interface
	var _ security.TokenVerifier = &mockTokenVerifier{}

	verifier := &mockTokenVerifier{
		claims: &security.TokenClaims{
			UserID: "user-1",
			Role:   "user",
		},
	}

	claims, err := verifier.Verify("test-token")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if claims.UserID != "user-1" {
		t.Errorf("expected UserID 'user-1', got '%s'", claims.UserID)
	}
}
