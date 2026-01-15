package security

import "context"

// TokenClaims represents the authenticated user information extracted from a JWT.
type TokenClaims struct {
	UserID   string
	Role     string
	Email    string
	Provider string
}

// TokenVerifier is responsible for validating access tokens issued by Supabase Auth.
type TokenVerifier interface {
	Verify(ctx context.Context, token string) (*TokenClaims, error)
}
