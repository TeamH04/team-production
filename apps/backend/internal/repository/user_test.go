package repository_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
)

func TestUserRepository_Create_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := repo.Create(context.Background(), user)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUserRepository_FindByID_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	// Create a user first
	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Find the user
	found, err := repo.FindByID(context.Background(), "user-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %s", found.UserID)
	}
	if found.Email != "test@example.com" {
		t.Errorf("expected Email test@example.com, got %s", found.Email)
	}
}

func TestUserRepository_FindByID_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	_, err := repo.FindByID(context.Background(), "nonexistent")

	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound error, got %v", err)
	}
}

func TestUserRepository_FindByEmail_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	// Create a user first
	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Find by email
	found, err := repo.FindByEmail(context.Background(), "test@example.com")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if found.UserID != "user-123" {
		t.Errorf("expected UserID user-123, got %s", found.UserID)
	}
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	_, err := repo.FindByEmail(context.Background(), "nonexistent@example.com")

	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound error, got %v", err)
	}
}

func TestUserRepository_Update_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	// Create a user first
	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Update the user
	user.Email = "updated@example.com"
	err := repo.Update(context.Background(), *user)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the update
	found, err := repo.FindByID(context.Background(), "user-123")
	if err != nil {
		t.Fatalf("failed to find user: %v", err)
	}
	if found.Email != "updated@example.com" {
		t.Errorf("expected Email updated@example.com, got %s", found.Email)
	}
}

func TestUserRepository_UpdateRole_Success(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	// Create a user first
	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := repo.Create(context.Background(), user); err != nil {
		t.Fatalf("failed to create user: %v", err)
	}

	// Update role
	err := repo.UpdateRole(context.Background(), "user-123", "admin")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify the update
	found, err := repo.FindByID(context.Background(), "user-123")
	if err != nil {
		t.Fatalf("failed to find user: %v", err)
	}
	if found.Role != "admin" {
		t.Errorf("expected Role admin, got %s", found.Role)
	}
}

func TestMapDBError_NilError(t *testing.T) {
	// Test that mapDBError returns nil for nil input
	// This is tested implicitly through successful repository operations
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	user := &entity.User{
		UserID:    "user-123",
		Email:     "test@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := repo.Create(context.Background(), user)

	if err != nil {
		t.Errorf("expected nil error for successful operation, got %v", err)
	}
}

func TestMapDBError_NotFoundError(t *testing.T) {
	// Test that mapDBError returns CodeNotFound for record not found
	db := testutil.SetupTestDB(t)
	defer testutil.CleanupTestDB(t, db)

	repo := repository.NewUserRepository(db)

	_, err := repo.FindByID(context.Background(), "nonexistent")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Errorf("expected CodeNotFound, got %v", err)
	}
	if !errors.Is(err, entity.ErrNotFound) {
		t.Errorf("expected underlying error to be ErrNotFound, got %v", err)
	}
}
