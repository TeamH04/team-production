package output

import (
	"context"
)

// AuthProvider abstracts external authentication services (e.g., Supabase).
type AuthProvider interface {
	Signup(ctx context.Context, input AuthSignupInput) (*AuthUser, error)
	Login(ctx context.Context, input AuthLoginInput) (*AuthSession, error)
}

type AuthSignupInput struct {
	Email    string
	Password string
	Name     string
	Role     string
}

type AuthLoginInput struct {
	Email    string
	Password string
}

type AuthUser struct {
	ID    string
	Email string
	Role  string
}

type AuthSession struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int
	User         AuthUser
}
