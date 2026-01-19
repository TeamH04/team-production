package security

import (
	"context"
	"strings"
)

// TokenClaims represents the authenticated user information extracted from a JWT.
type TokenClaims struct {
	UserID   string
	Role     string
	Email    string
	Provider string
	Name     string
	IconURL  string
	Gender   string
}

// TokenVerifier is responsible for validating access tokens issued by Supabase Auth.
type TokenVerifier interface {
	Verify(ctx context.Context, token string) (*TokenClaims, error)
}

// ExtractBearerToken extracts the token from an Authorization header value.
// Returns the token string and an error if the format is invalid.
// Accepts both "Bearer <token>" format and plain token.
func ExtractBearerToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", nil // Empty is allowed, caller decides how to handle
	}

	if strings.HasPrefix(authHeader, BearerPrefix) {
		token := strings.TrimSpace(strings.TrimPrefix(authHeader, BearerPrefix))
		return token, nil
	}

	// Return trimmed value if no Bearer prefix (for backwards compatibility)
	return strings.TrimSpace(authHeader), nil
}
