package port

import (
	"context"
	"time"
)

type SignUpInput struct {
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	Name    string `json:"name,omitempty"`
	Picture string `json:"picture,omitempty"`
	Role    string `json:"role"`
}

type SignUpOutput struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	Name      string     `json:"name,omitempty"`
	Picture   string     `json:"picture,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type LoginInput struct {
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	Name    string `json:"name,omitempty"`
	Picture string `json:"picture,omitempty"`
}

type LoginOutput struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	Name      string     `json:"name,omitempty"`
	Picture   string     `json:"picture,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type AuthUsecase interface {
	SignUp(SignUpInput) (*SignUpOutput, error)
	Login(ctx context.Context, input LoginInput) (*LoginOutput, error)
	GetUser(ctx context.Context, userID string) (*User, error)
}
