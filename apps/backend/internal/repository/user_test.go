package repository_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupUserTest creates common test dependencies for user tests
func setupUserTest(t *testing.T) output.UserRepository {
	t.Helper()
	db := testutil.SetupTestDB(t)
	repo := repository.NewUserRepository(db)
	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})
	return repo
}

// newTestUser creates a test user with unique ID
func newTestUser(t *testing.T) *entity.User {
	t.Helper()
	return &entity.User{
		UserID:    "user-" + uuid.New().String()[:8],
		Email:     "test-" + uuid.New().String()[:8] + "@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

func TestUserRepository_Create_Success(t *testing.T) {
	repo := setupUserTest(t)

	user := newTestUser(t)

	err := repo.Create(context.Background(), user)
	require.NoError(t, err)
}

func TestUserRepository_FindByID_Success(t *testing.T) {
	repo := setupUserTest(t)

	// Create a user first
	user := newTestUser(t)
	require.NoError(t, repo.Create(context.Background(), user))

	// Find the user
	found, err := repo.FindByID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Equal(t, user.UserID, found.UserID)
	require.Equal(t, user.Email, found.Email)
}

func TestUserRepository_FindByID_NotFound(t *testing.T) {
	repo := setupUserTest(t)

	nonexistentID := "user-" + uuid.New().String()[:8]
	_, err := repo.FindByID(context.Background(), nonexistentID)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

func TestUserRepository_FindByEmail_Success(t *testing.T) {
	repo := setupUserTest(t)

	// Create a user first
	user := newTestUser(t)
	require.NoError(t, repo.Create(context.Background(), user))

	// Find by email
	found, err := repo.FindByEmail(context.Background(), user.Email)
	require.NoError(t, err)
	require.Equal(t, user.UserID, found.UserID)
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	repo := setupUserTest(t)

	nonexistentEmail := "nonexistent-" + uuid.New().String()[:8] + "@example.com"
	_, err := repo.FindByEmail(context.Background(), nonexistentEmail)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

func TestUserRepository_Update_Success(t *testing.T) {
	repo := setupUserTest(t)

	// Create a user first
	user := newTestUser(t)
	require.NoError(t, repo.Create(context.Background(), user))

	// Update the user
	updatedEmail := "updated-" + uuid.New().String()[:8] + "@example.com"
	user.Email = updatedEmail
	err := repo.Update(context.Background(), *user)
	require.NoError(t, err)

	// Verify the update
	found, err := repo.FindByID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Equal(t, updatedEmail, found.Email)
}

func TestUserRepository_UpdateRole_Success(t *testing.T) {
	repo := setupUserTest(t)

	// Create a user first
	user := newTestUser(t)
	require.NoError(t, repo.Create(context.Background(), user))

	// Update role
	err := repo.UpdateRole(context.Background(), user.UserID, "admin")
	require.NoError(t, err)

	// Verify the update
	found, err := repo.FindByID(context.Background(), user.UserID)
	require.NoError(t, err)
	require.Equal(t, "admin", found.Role)
}

func TestUserRepository_Create_ReturnsNilOnSuccess(t *testing.T) {
	// Verifies that successful operations return nil error
	// (implicitly tests mapDBError returns nil for nil input)
	repo := setupUserTest(t)

	user := newTestUser(t)

	err := repo.Create(context.Background(), user)
	require.NoError(t, err, "expected nil error for successful operation")
}

func TestUserRepository_FindByID_ReturnsNotFoundError(t *testing.T) {
	// Verifies that non-existent records return CodeNotFound and ErrNotFound
	// (implicitly tests mapDBError returns CodeNotFound for record not found)
	repo := setupUserTest(t)

	nonexistentID := "user-" + uuid.New().String()[:8]
	_, err := repo.FindByID(context.Background(), nonexistentID)

	require.Error(t, err, "expected error, got nil")
	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound, got %v", err)
	require.True(t, errors.Is(err, entity.ErrNotFound), "expected underlying error to be ErrNotFound, got %v", err)
}
