package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

const testAuthUserID = "user-1"

// --- Signup Tests ---

func TestSignup_Success(t *testing.T) {
	authProvider := &testutil.MockAuthProvider{
		SignupResult: &output.AuthUser{
			ID:    testAuthUserID,
			Email: "test@example.com",
			Role:  "user",
		},
	}
	userRepo := &testutil.MockUserRepository{
		FindByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	result, err := uc.Signup(context.Background(), input.AuthSignupInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != testAuthUserID {
		t.Errorf("expected UserID %s, got %s", testAuthUserID, result.UserID)
	}
	if result.Email != "test@example.com" {
		t.Errorf("expected Email test@example.com, got %s", result.Email)
	}
	if result.Provider != "email" {
		t.Errorf("expected Provider email, got %s", result.Provider)
	}
}

func TestSignup_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		input   input.AuthSignupInput
		wantErr error
	}{
		{
			name:    "empty email",
			input:   input.AuthSignupInput{Email: "", Password: "password123", Name: "Test"},
			wantErr: usecase.ErrInvalidInput,
		},
		{
			name:    "empty password",
			input:   input.AuthSignupInput{Email: "test@example.com", Password: "", Name: "Test"},
			wantErr: usecase.ErrInvalidInput,
		},
		{
			name:    "empty name",
			input:   input.AuthSignupInput{Email: "test@example.com", Password: "password123", Name: ""},
			wantErr: usecase.ErrInvalidInput,
		},
		{
			name:    "short password",
			input:   input.AuthSignupInput{Email: "test@example.com", Password: "12345", Name: "Test"},
			wantErr: usecase.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authProvider := &testutil.MockAuthProvider{}
			userRepo := &testutil.MockUserRepository{}

			uc := usecase.NewAuthUseCase(authProvider, userRepo)

			_, err := uc.Signup(context.Background(), tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestSignup_UserAlreadyExists(t *testing.T) {
	authProvider := &testutil.MockAuthProvider{}
	userRepo := &testutil.MockUserRepository{
		FindByEmailResult: &entity.User{
			UserID: "existing-user",
			Email:  "test@example.com",
		},
	}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Signup(context.Background(), input.AuthSignupInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	})
	if !errors.Is(err, usecase.ErrUserAlreadyExists) {
		t.Errorf("expected ErrUserAlreadyExists, got %v", err)
	}
}

func TestSignup_AuthProviderError(t *testing.T) {
	providerErr := errors.New("auth provider error")
	authProvider := &testutil.MockAuthProvider{
		SignupErr: providerErr,
	}
	userRepo := &testutil.MockUserRepository{
		FindByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Signup(context.Background(), input.AuthSignupInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	})
	if !errors.Is(err, providerErr) {
		t.Errorf("expected auth provider error, got %v", err)
	}
}

func TestSignup_UserRepoCreateError(t *testing.T) {
	authProvider := &testutil.MockAuthProvider{
		SignupResult: &output.AuthUser{
			ID:    testAuthUserID,
			Email: "test@example.com",
			Role:  "user",
		},
	}
	createErr := errors.New("database error")
	userRepo := &testutil.MockUserRepository{
		FindByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
		CreateErr:      createErr,
	}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Signup(context.Background(), input.AuthSignupInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	})
	if !errors.Is(err, createErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

func TestSignup_FindByEmailError(t *testing.T) {
	dbErr := errors.New("database connection error")
	authProvider := &testutil.MockAuthProvider{}
	userRepo := &testutil.MockUserRepository{
		FindByEmailErr: dbErr,
	}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Signup(context.Background(), input.AuthSignupInput{
		Email:    "test@example.com",
		Password: "password123",
		Name:     "Test User",
	})
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database connection error, got %v", err)
	}
}

// --- Login Tests ---

func TestLogin_Success(t *testing.T) {
	authProvider := &testutil.MockAuthProvider{
		LoginResult: &output.AuthSession{
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
			User: output.AuthUser{
				ID:    testAuthUserID,
				Email: "test@example.com",
				Role:  "user",
			},
		},
	}
	userRepo := &testutil.MockUserRepository{}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	result, err := uc.Login(context.Background(), input.AuthLoginInput{
		Email:    "test@example.com",
		Password: "password123",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.AccessToken != "access-token" {
		t.Errorf("expected AccessToken access-token, got %s", result.AccessToken)
	}
	if result.RefreshToken != "refresh-token" {
		t.Errorf("expected RefreshToken refresh-token, got %s", result.RefreshToken)
	}
	if result.User.ID != testAuthUserID {
		t.Errorf("expected User.ID %s, got %s", testAuthUserID, result.User.ID)
	}
}

func TestLogin_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		input   input.AuthLoginInput
		wantErr error
	}{
		{
			name:    "empty email",
			input:   input.AuthLoginInput{Email: "", Password: "password123"},
			wantErr: usecase.ErrInvalidInput,
		},
		{
			name:    "empty password",
			input:   input.AuthLoginInput{Email: "test@example.com", Password: ""},
			wantErr: usecase.ErrInvalidInput,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authProvider := &testutil.MockAuthProvider{}
			userRepo := &testutil.MockUserRepository{}

			uc := usecase.NewAuthUseCase(authProvider, userRepo)

			_, err := uc.Login(context.Background(), tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestLogin_AuthProviderError(t *testing.T) {
	providerErr := errors.New("invalid credentials")
	authProvider := &testutil.MockAuthProvider{
		LoginErr: providerErr,
	}
	userRepo := &testutil.MockUserRepository{}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Login(context.Background(), input.AuthLoginInput{
		Email:    "test@example.com",
		Password: "wrongpassword",
	})
	if !errors.Is(err, providerErr) {
		t.Errorf("expected auth provider error, got %v", err)
	}
}

// TestLogin_NilSession tests that Login returns nil when auth provider returns nil session
func TestLogin_NilSession(t *testing.T) {
	authProvider := &testutil.MockAuthProvider{
		LoginResult: nil, // Provider returns nil session
	}
	userRepo := &testutil.MockUserRepository{}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	result, err := uc.Login(context.Background(), input.AuthLoginInput{
		Email:    "test@example.com",
		Password: "password123",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result when provider returns nil session, got %+v", result)
	}
}
