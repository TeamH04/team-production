package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// mockAuthProvider implements output.AuthProvider for testing
type mockAuthProvider struct {
	signupResult *output.AuthUser
	signupErr    error
	loginResult  *output.AuthSession
	loginErr     error
}

func (m *mockAuthProvider) Signup(ctx context.Context, input output.AuthSignupInput) (*output.AuthUser, error) {
	if m.signupErr != nil {
		return nil, m.signupErr
	}
	return m.signupResult, nil
}

func (m *mockAuthProvider) Login(ctx context.Context, input output.AuthLoginInput) (*output.AuthSession, error) {
	if m.loginErr != nil {
		return nil, m.loginErr
	}
	return m.loginResult, nil
}

// mockUserRepoForAuth implements output.UserRepository for auth tests
type mockUserRepoForAuth struct {
	findByIDResult    entity.User
	findByIDErr       error
	findByEmailResult *entity.User
	findByEmailErr    error
	createErr         error
	updateErr         error
	updateRoleErr     error
}

func (m *mockUserRepoForAuth) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserRepoForAuth) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	if m.findByEmailErr != nil {
		return nil, m.findByEmailErr
	}
	return m.findByEmailResult, nil
}

func (m *mockUserRepoForAuth) Create(ctx context.Context, user *entity.User) error {
	return m.createErr
}

func (m *mockUserRepoForAuth) Update(ctx context.Context, user entity.User) error {
	return m.updateErr
}

func (m *mockUserRepoForAuth) UpdateRole(ctx context.Context, userID string, role string) error {
	return m.updateRoleErr
}

// --- Signup Tests ---

func TestSignup_Success(t *testing.T) {
	authProvider := &mockAuthProvider{
		signupResult: &output.AuthUser{
			ID:    "user-1",
			Email: "test@example.com",
			Role:  "user",
		},
	}
	userRepo := &mockUserRepoForAuth{
		findByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
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
	if result.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", result.UserID)
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
		name     string
		input    input.AuthSignupInput
		wantErr  error
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
			authProvider := &mockAuthProvider{}
			userRepo := &mockUserRepoForAuth{}

			uc := usecase.NewAuthUseCase(authProvider, userRepo)

			_, err := uc.Signup(context.Background(), tt.input)
			if !errors.Is(err, tt.wantErr) {
				t.Errorf("expected %v, got %v", tt.wantErr, err)
			}
		})
	}
}

func TestSignup_UserAlreadyExists(t *testing.T) {
	authProvider := &mockAuthProvider{}
	userRepo := &mockUserRepoForAuth{
		findByEmailResult: &entity.User{
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
	authProvider := &mockAuthProvider{
		signupErr: providerErr,
	}
	userRepo := &mockUserRepoForAuth{
		findByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
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
	authProvider := &mockAuthProvider{
		signupResult: &output.AuthUser{
			ID:    "user-1",
			Email: "test@example.com",
			Role:  "user",
		},
	}
	createErr := errors.New("database error")
	userRepo := &mockUserRepoForAuth{
		findByEmailErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
		createErr:      createErr,
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
	authProvider := &mockAuthProvider{}
	userRepo := &mockUserRepoForAuth{
		findByEmailErr: dbErr,
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
	authProvider := &mockAuthProvider{
		loginResult: &output.AuthSession{
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
			User: output.AuthUser{
				ID:    "user-1",
				Email: "test@example.com",
				Role:  "user",
			},
		},
	}
	userRepo := &mockUserRepoForAuth{}

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
	if result.User.ID != "user-1" {
		t.Errorf("expected User.ID user-1, got %s", result.User.ID)
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
			authProvider := &mockAuthProvider{}
			userRepo := &mockUserRepoForAuth{}

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
	authProvider := &mockAuthProvider{
		loginErr: providerErr,
	}
	userRepo := &mockUserRepoForAuth{}

	uc := usecase.NewAuthUseCase(authProvider, userRepo)

	_, err := uc.Login(context.Background(), input.AuthLoginInput{
		Email:    "test@example.com",
		Password: "wrongpassword",
	})
	if !errors.Is(err, providerErr) {
		t.Errorf("expected auth provider error, got %v", err)
	}
}
