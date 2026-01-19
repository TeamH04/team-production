package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

const (
	testGenderMale   = "male"
	testGenderFemale = "female"
	testIconURL      = "https://example.com/icon.png"
)

// --- FindByID Tests ---

func TestFindByID_Success(t *testing.T) {
	expected := entity.User{UserID: "user-1", Name: "Test User", Email: "test@example.com"}
	userRepo := &testutil.MockUserRepository{FindByIDResult: expected}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.FindByID(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != expected.UserID {
		t.Errorf("expected UserID %s, got %s", expected.UserID, result.UserID)
	}
	if result.Name != expected.Name {
		t.Errorf("expected Name %s, got %s", expected.Name, result.Name)
	}
}

func TestFindByID_NotFound(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.FindByID(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestFindByID_RepositoryError(t *testing.T) {
	expectedErr := errors.New("database error")
	userRepo := &testutil.MockUserRepository{FindByIDErr: expectedErr}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.FindByID(context.Background(), "user-1")
	if !errors.Is(err, expectedErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- EnsureUser Tests ---

func TestEnsureUser_ExistingUser_NoProviderUpdate(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != existingUser.UserID {
		t.Errorf("expected UserID %s, got %s", existingUser.UserID, result.UserID)
	}
	if userRepo.UpdateCalled {
		t.Error("expected Update not to be called when provider is the same")
	}
}

func TestEnsureUser_ExistingUser_ProviderUpdate(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Provider != "google" {
		t.Errorf("expected Provider to be updated to google, got %s", result.Provider)
	}
	if !userRepo.UpdateCalled {
		t.Error("expected Update to be called when provider is upgraded from oauth")
	}
}

func TestEnsureUser_ExistingUser_ProfileUpdate(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
		Name:     "Google User",
		IconURL:  testIconURL,
		Gender:   testGenderFemale,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "Google User" {
		t.Errorf("expected Name to be updated to Google User, got %s", result.Name)
	}
	if result.IconURL == nil || *result.IconURL != testIconURL {
		t.Error("expected IconURL to be set from claims")
	}
	if result.Gender == nil || *result.Gender != testGenderFemale {
		t.Error("expected Gender to be set from claims")
	}
	if !userRepo.UpdateCalled {
		t.Error("expected Update to be called when profile fields are missing")
	}
}

func TestEnsureUser_ExistingUser_NoProfileOverride(t *testing.T) {
	iconFileID := "file-1"
	existingGender := testGenderMale
	existingUser := entity.User{
		UserID:     "user-1",
		Name:       "Existing User",
		Email:      "test@example.com",
		Provider:   "google",
		IconFileID: &iconFileID,
		Gender:     &existingGender,
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
		Name:     "New Name",
		IconURL:  "https://example.com/new-icon.png",
		Gender:   testGenderFemale,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "Existing User" {
		t.Errorf("expected Name to remain unchanged, got %s", result.Name)
	}
	if result.IconFileID == nil || *result.IconFileID != "file-1" {
		t.Error("expected IconFileID to remain unchanged")
	}
	if result.Gender == nil || *result.Gender != testGenderMale {
		t.Error("expected Gender to remain unchanged")
	}
	if userRepo.UpdateCalled {
		t.Error("expected Update not to be called when profile fields already exist")
	}
}

func TestEnsureUser_NewUser_Success(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "new-user-1",
		Email:    "newuser@example.com",
		Provider: "google",
		Role:     "user",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != "new-user-1" {
		t.Errorf("expected UserID new-user-1, got %s", result.UserID)
	}
	if result.Email != "newuser@example.com" {
		t.Errorf("expected Email newuser@example.com, got %s", result.Email)
	}
	if result.Name != "newuser" {
		t.Errorf("expected Name derived from email to be 'newuser', got %s", result.Name)
	}
	if !userRepo.CreateCalled {
		t.Error("expected Create to be called for new user")
	}
}

func TestEnsureUser_NewUser_UsesProvidedProfile(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "new-user-2",
		Email:    "profile@example.com",
		Provider: "google",
		Role:     "user",
		Name:     "Profile Name",
		IconURL:  testIconURL,
		Gender:   testGenderFemale,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "Profile Name" {
		t.Errorf("expected Name to use provided value, got %s", result.Name)
	}
	if result.IconURL == nil || *result.IconURL != testIconURL {
		t.Error("expected IconURL to use provided value")
	}
	if result.Gender == nil || *result.Gender != testGenderFemale {
		t.Error("expected Gender to use provided value")
	}
	if !userRepo.CreateCalled {
		t.Error("expected Create to be called for new user")
	}
}

func TestEnsureUser_InvalidInput_EmptyUserID(t *testing.T) {
	userRepo := &testutil.MockUserRepository{}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID: "",
		Email:  "test@example.com",
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput for empty userID, got %v", err)
	}
}

func TestEnsureUser_InvalidInput_EmptyEmail(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID: "user-1",
		Email:  "",
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput for empty email, got %v", err)
	}
}

func TestEnsureUser_InvalidRole_DefaultsToUser(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID: "user-1",
		Email:  "test@example.com",
		Role:   "invalid_role",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Role != "user" {
		t.Errorf("expected Role to default to 'user', got %s", result.Role)
	}
}

func TestEnsureUser_RaceCondition_CreateFails(t *testing.T) {
	// This test simulates a race condition where:
	// 1. FindByID returns "not found"
	// 2. Create fails because another goroutine created the user first
	// 3. Retry FindByID finds the user created by the other goroutine
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth",
	}

	// Create a mock that simulates the race condition state machine
	customRepo := &raceConditionMockUserRepo{
		state:        stateInitial,
		existingUser: existingUser,
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(customRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != existingUser.UserID {
		t.Errorf("expected to get existing user after race condition")
	}
}

// raceConditionMockUserRepo simulates a race condition during user creation.
//
// This mock implements a state machine to test the scenario where:
//  1. First FindByID returns "not found" (user doesn't exist yet)
//  2. Create fails with "duplicate key" (another request created the user)
//  3. Second FindByID returns the existing user (retry succeeds)
//
// State transitions:
//
//	Initial -> AfterFirstFind -> AfterCreateAttempt -> (returns existing user)
type raceConditionMockUserRepo struct {
	// state tracks the current position in the race condition simulation
	state        raceConditionState
	existingUser entity.User
}

// raceConditionState represents the mock's internal state
type raceConditionState int

const (
	// stateInitial: Before any FindByID call
	stateInitial raceConditionState = iota
	// stateAfterFirstFind: After first FindByID returned not found
	stateAfterFirstFind
	// stateAfterCreateAttempt: After Create failed with duplicate key
	stateAfterCreateAttempt
)

// FindByID simulates finding a user by ID.
// First call: returns not found (simulating user doesn't exist yet)
// Second call: returns existing user (simulating another request created it)
func (m *raceConditionMockUserRepo) FindByID(ctx context.Context, userID string) (entity.User, error) {
	switch m.state {
	case stateInitial:
		// First call: user doesn't exist yet
		m.state = stateAfterFirstFind
		return entity.User{}, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	default:
		// Second call (after Create failed): user now exists
		return m.existingUser, nil
	}
}

// FindByEmail is not used in this test scenario
func (m *raceConditionMockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

// Create simulates a duplicate key error (another request already created the user)
func (m *raceConditionMockUserRepo) Create(ctx context.Context, user *entity.User) error {
	m.state = stateAfterCreateAttempt
	return errors.New("duplicate key")
}

// Update stores the updated user for later retrieval
func (m *raceConditionMockUserRepo) Update(ctx context.Context, user entity.User) error {
	m.existingUser = user
	return nil
}

// UpdateRole is not used in this test scenario
func (m *raceConditionMockUserRepo) UpdateRole(ctx context.Context, userID string, role string) error {
	return nil
}

// TestEnsureUser_RaceCondition_UpdateProviderFails tests the scenario where:
// 1. First FindByID returns not found (user doesn't exist)
// 2. Create fails due to race condition (another process created the user)
// 3. Second FindByID succeeds and returns existing user with "oauth" provider
// 4. shouldUpdateProvider returns true (current is "oauth", incoming is "google")
// 5. Update call FAILS with an error
// 6. The error should be properly propagated
func TestEnsureUser_RaceCondition_UpdateProviderFails(t *testing.T) {
	updateErr := errors.New("database update error")
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth", // This will trigger shouldUpdateProvider to return true when incoming is "google"
	}

	// Create a custom mock that simulates the race condition with Update failure
	customRepo := &raceConditionUpdateFailMockUserRepo{
		state:        stateInitial,
		existingUser: existingUser,
		updateErr:    updateErr,
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(customRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google", // This triggers provider update since existing is "oauth"
	})

	// Verify that the update error is properly propagated
	if !errors.Is(err, updateErr) {
		t.Errorf("expected updateErr to be propagated, got %v", err)
	}
	if result.UserID != "" {
		t.Errorf("expected empty user on error, got UserID: %s", result.UserID)
	}
	if !customRepo.updateCalled {
		t.Error("expected Update to be called during race condition recovery")
	}
}

// raceConditionUpdateFailMockUserRepo simulates a race condition where:
// - First FindByID returns not found
// - Create fails (duplicate key from race)
// - Second FindByID returns the existing user with "oauth" provider
// - Update fails with an error (testing the error propagation path)
type raceConditionUpdateFailMockUserRepo struct {
	state        raceConditionState
	existingUser entity.User
	updateErr    error
	updateCalled bool
}

func (m *raceConditionUpdateFailMockUserRepo) FindByID(ctx context.Context, userID string) (entity.User, error) {
	switch m.state {
	case stateInitial:
		// First call: user not found
		m.state = stateAfterFirstFind
		return entity.User{}, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	default:
		// Second call (after Create fails): return existing user with "oauth" provider
		return m.existingUser, nil
	}
}

func (m *raceConditionUpdateFailMockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

func (m *raceConditionUpdateFailMockUserRepo) Create(ctx context.Context, user *entity.User) error {
	// Simulate race condition: another process already created the user
	m.state = stateAfterCreateAttempt
	return errors.New("duplicate key")
}

func (m *raceConditionUpdateFailMockUserRepo) Update(ctx context.Context, user entity.User) error {
	m.updateCalled = true
	return m.updateErr
}

func (m *raceConditionUpdateFailMockUserRepo) UpdateRole(ctx context.Context, userID string, role string) error {
	return nil
}

// --- shouldUpdateProvider Logic Tests ---
// Since shouldUpdateProvider is an internal function, we test its logic indirectly
// through EnsureUser by checking whether Update is called in various scenarios.

func TestShouldUpdateProvider_Logic(t *testing.T) {
	tests := []struct {
		name             string
		currentProvider  string
		incomingProvider string
		expectUpdate     bool
		description      string
	}{
		{
			name:             "empty current, specific incoming - should update",
			currentProvider:  "",
			incomingProvider: "google",
			expectUpdate:     true,
			description:      "Empty provider should be upgraded to specific provider",
		},
		{
			name:             "oauth current, specific incoming - should update",
			currentProvider:  "oauth",
			incomingProvider: "google",
			expectUpdate:     true,
			description:      "Generic oauth should be upgraded to specific provider",
		},
		{
			name:             "specific current, different specific incoming - should NOT update",
			currentProvider:  "google",
			incomingProvider: "apple",
			expectUpdate:     false,
			description:      "Already has specific provider, should not change",
		},
		{
			name:             "specific current, empty incoming - should NOT update",
			currentProvider:  "google",
			incomingProvider: "",
			expectUpdate:     false,
			description:      "Should not downgrade to empty provider",
		},
		{
			name:             "specific current, oauth incoming - should NOT update",
			currentProvider:  "google",
			incomingProvider: "oauth",
			expectUpdate:     false,
			description:      "Should not downgrade to generic oauth",
		},
		{
			name:             "oauth current, oauth incoming - should NOT update",
			currentProvider:  "oauth",
			incomingProvider: "oauth",
			expectUpdate:     false,
			description:      "Same oauth provider, no update needed",
		},
		{
			name:             "empty current, empty incoming - should NOT update",
			currentProvider:  "",
			incomingProvider: "",
			expectUpdate:     false,
			description:      "Both empty, no update needed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			existingUser := entity.User{
				UserID:   "user-1",
				Email:    "test@example.com",
				Provider: tt.currentProvider,
			}

			userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
			reviewRepo := &testutil.MockReviewRepository{}

			uc := usecase.NewUserUseCase(userRepo, reviewRepo)

			_, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
				UserID:   "user-1",
				Email:    "test@example.com",
				Provider: tt.incomingProvider,
			})
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if userRepo.UpdateCalled != tt.expectUpdate {
				t.Errorf("%s: expected UpdateCalled=%v, got %v",
					tt.description, tt.expectUpdate, userRepo.UpdateCalled)
			}
		})
	}
}

// --- UpdateUser Tests ---

func TestUpdateUser_Success(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Old Name",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := testNewName
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Name: &newName,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != newName {
		t.Errorf("expected Name %s, got %s", newName, result.Name)
	}
}

func TestUpdateUser_NotFound(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := testNewName
	_, err := uc.UpdateUser(context.Background(), "nonexistent", input.UpdateUserInput{
		Name: &newName,
	})
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestUpdateUser_PartialUpdate(t *testing.T) {
	iconURL := testIconURL
	existingUser := entity.User{
		UserID:  "user-1",
		Name:    "Test User",
		Email:   "test@example.com",
		IconURL: &iconURL,
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := "Updated Name"
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Name: &newName,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != newName {
		t.Errorf("expected Name to be updated to %s, got %s", newName, result.Name)
	}
	if result.IconURL == nil || *result.IconURL != iconURL {
		t.Error("expected IconURL to remain unchanged")
	}
}

func TestUpdateUser_RepositoryError(t *testing.T) {
	existingUser := entity.User{UserID: "user-1", Name: "Test User"}
	userRepo := &testutil.MockUserRepository{
		FindByIDResult: existingUser,
		UpdateErr:      errors.New("database error"),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := testNewName
	_, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Name: &newName,
	})
	if err == nil {
		t.Error("expected error from repository")
	}
}

// --- UpdateUserRole Tests ---

func TestUpdateUserRole_Success(t *testing.T) {
	existingUser := entity.User{UserID: "user-1", Role: "user"}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	err := uc.UpdateUserRole(context.Background(), "user-1", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUpdateUserRole_InvalidRole(t *testing.T) {
	tests := []struct {
		name string
		role string
	}{
		{"empty role", ""},
		{"invalid role", "superuser"},
		{"unknown role", "moderator"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			existingUser := entity.User{UserID: "user-1", Role: "user"}
			userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
			reviewRepo := &testutil.MockReviewRepository{}

			uc := usecase.NewUserUseCase(userRepo, reviewRepo)

			err := uc.UpdateUserRole(context.Background(), "user-1", tt.role)
			if !errors.Is(err, usecase.ErrInvalidRole) {
				t.Errorf("expected ErrInvalidRole for role %q, got %v", tt.role, err)
			}
		})
	}
}

func TestUpdateUserRole_ValidRoles(t *testing.T) {
	validRoles := []string{"user", "owner", "admin"}

	for _, role := range validRoles {
		t.Run(role, func(t *testing.T) {
			existingUser := entity.User{UserID: "user-1", Role: "user"}
			userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
			reviewRepo := &testutil.MockReviewRepository{}

			uc := usecase.NewUserUseCase(userRepo, reviewRepo)

			err := uc.UpdateUserRole(context.Background(), "user-1", role)
			if err != nil {
				t.Errorf("expected no error for valid role %q, got %v", role, err)
			}
		})
	}
}

func TestUpdateUserRole_UserNotFound(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	err := uc.UpdateUserRole(context.Background(), "nonexistent", "admin")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

// --- GetUserReviews Tests ---

func TestGetUserReviews_Success(t *testing.T) {
	existingUser := entity.User{UserID: "user-1"}
	reviews := []entity.Review{
		{ReviewID: "review-1", UserID: "user-1", Rating: 5},
		{ReviewID: "review-2", UserID: "user-1", Rating: 4},
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{FindByUserIDResult: reviews}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.GetUserReviews(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 reviews, got %d", len(result))
	}
}

func TestGetUserReviews_UserNotFound(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.GetUserReviews(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestGetUserReviews_EmptyReviews(t *testing.T) {
	existingUser := entity.User{UserID: "user-1"}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{FindByUserIDResult: []entity.Review{}}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.GetUserReviews(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected 0 reviews, got %d", len(result))
	}
}

func TestGetUserReviews_RepositoryError(t *testing.T) {
	existingUser := entity.User{UserID: "user-1"}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{FindByUserIDErr: errors.New("database error")}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.GetUserReviews(context.Background(), "user-1")
	if err == nil {
		t.Error("expected error from repository")
	}
}

// --- EnsureUser Provider Update Error Path Tests ---

func TestEnsureUser_ProviderUpdate_UpdateError(t *testing.T) {
	updateErr := errors.New("update error")
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth", // Will trigger update when incoming is "google"
	}
	userRepo := &testutil.MockUserRepository{
		FindByIDResult: existingUser,
		UpdateErr:      updateErr,
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}

func TestEnsureUser_FindByID_NonNotFoundError(t *testing.T) {
	dbErr := errors.New("database connection error")
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: dbErr, // non-NotFound error
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- UpdateUser All Fields Tests ---

func TestUpdateUser_AllFields(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Old Name",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := "New Name"
	newIconURL := testIconURL
	newIconFileID := "file-123"
	newGender := testGenderMale
	newBirthday := time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC)

	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Name:       &newName,
		IconURL:    &newIconURL,
		IconFileID: &newIconFileID,
		Gender:     &newGender,
		Birthday:   &newBirthday,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != newName {
		t.Errorf("expected Name %s, got %s", newName, result.Name)
	}
	if result.IconURL == nil || *result.IconURL != newIconURL {
		t.Errorf("expected IconURL %s, got %v", newIconURL, result.IconURL)
	}
	if result.IconFileID == nil || *result.IconFileID != newIconFileID {
		t.Errorf("expected IconFileID %s, got %v", newIconFileID, result.IconFileID)
	}
	if result.Gender == nil || *result.Gender != newGender {
		t.Errorf("expected Gender %s, got %v", newGender, result.Gender)
	}
	if result.Birthday == nil || !result.Birthday.Equal(newBirthday) {
		t.Errorf("expected Birthday %v, got %v", newBirthday, result.Birthday)
	}
}

func TestUpdateUser_OnlyIconURL(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Test User",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newIconURL := "https://example.com/new-icon.png"
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		IconURL: &newIconURL,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.IconURL == nil || *result.IconURL != newIconURL {
		t.Errorf("expected IconURL %s, got %v", newIconURL, result.IconURL)
	}
	if result.Name != "Test User" {
		t.Errorf("expected Name to remain 'Test User', got %s", result.Name)
	}
}

func TestUpdateUser_OnlyIconFileID(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Test User",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newIconFileID := "file-456"
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		IconFileID: &newIconFileID,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.IconFileID == nil || *result.IconFileID != newIconFileID {
		t.Errorf("expected IconFileID %s, got %v", newIconFileID, result.IconFileID)
	}
}

func TestUpdateUser_OnlyGender(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Test User",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newGender := testGenderFemale
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Gender: &newGender,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Gender == nil || *result.Gender != newGender {
		t.Errorf("expected Gender %s, got %v", newGender, result.Gender)
	}
}

func TestUpdateUser_OnlyBirthday(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Test User",
		Email:  "test@example.com",
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: existingUser}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newBirthday := time.Date(2000, 12, 25, 0, 0, 0, 0, time.UTC)
	result, err := uc.UpdateUser(context.Background(), "user-1", input.UpdateUserInput{
		Birthday: &newBirthday,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Birthday == nil || !result.Birthday.Equal(newBirthday) {
		t.Errorf("expected Birthday %v, got %v", newBirthday, result.Birthday)
	}
}

// --- deriveNameFromEmail Edge Cases ---

func TestEnsureUser_DeriveNameFromEmail_EdgeCases(t *testing.T) {
	tests := []struct {
		name         string
		email        string
		expectedName string
	}{
		{
			name:         "normal email",
			email:        "john.doe@example.com",
			expectedName: "john.doe",
		},
		{
			name:         "email with spaces (trimmed)",
			email:        "  alice@example.com  ",
			expectedName: "alice",
		},
		{
			name:         "email with only domain part (just @)",
			email:        "@example.com",
			expectedName: "user",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userRepo := &testutil.MockUserRepository{
				FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
			}
			reviewRepo := &testutil.MockReviewRepository{}

			uc := usecase.NewUserUseCase(userRepo, reviewRepo)

			result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
				UserID:   "new-user",
				Email:    tt.email,
				Provider: "google",
			})
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result.Name != tt.expectedName {
				t.Errorf("expected Name %s, got %s", tt.expectedName, result.Name)
			}
		})
	}
}

// --- UpdateUserRole Repository Error ---

func TestUpdateUserRole_RepositoryError(t *testing.T) {
	repoErr := errors.New("repository error")
	existingUser := entity.User{UserID: "user-1", Role: "user"}
	userRepo := &testutil.MockUserRepository{
		FindByIDResult: existingUser,
		UpdateRoleErr:  repoErr,
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	err := uc.UpdateUserRole(context.Background(), "user-1", "admin")
	if !errors.Is(err, repoErr) {
		t.Errorf("expected repository error, got %v", err)
	}
}

func TestUpdateUserRole_FindByID_NonNotFoundError(t *testing.T) {
	dbErr := errors.New("database connection error")
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: dbErr, // non-NotFound error
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	err := uc.UpdateUserRole(context.Background(), "user-1", "admin")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- GetUserReviews FindByID Error ---

func TestGetUserReviews_FindByID_NonNotFoundError(t *testing.T) {
	dbErr := errors.New("database connection error")
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: dbErr, // non-NotFound error
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.GetUserReviews(context.Background(), "user-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- EnsureUser Race Condition Edge Cases ---

// TestEnsureUser_RaceCondition_NoProviderUpdateNeeded tests the race condition where:
// 1. First FindByID returns not found
// 2. Create fails (race condition - another process created the user)
// 3. Second FindByID returns existing user with specific provider (e.g., "google")
// 4. shouldUpdateProvider returns false (incoming is same or lower priority)
// 5. Returns the existing user without calling Update
func TestEnsureUser_RaceCondition_NoProviderUpdateNeeded(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google", // Already has specific provider
	}

	customRepo := &raceConditionNoUpdateMockUserRepo{
		state:        stateInitial,
		existingUser: existingUser,
	}
	reviewRepo := &testutil.MockReviewRepository{}

	uc := usecase.NewUserUseCase(customRepo, reviewRepo)

	// Provider is same as existing - shouldUpdateProvider should return false
	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != existingUser.UserID {
		t.Errorf("expected to get existing user after race condition")
	}
	if customRepo.updateCalled {
		t.Error("expected Update NOT to be called when provider update is not needed")
	}
}

// raceConditionNoUpdateMockUserRepo simulates race condition where no provider update is needed
type raceConditionNoUpdateMockUserRepo struct {
	state        raceConditionState
	existingUser entity.User
	updateCalled bool
}

func (m *raceConditionNoUpdateMockUserRepo) FindByID(ctx context.Context, userID string) (entity.User, error) {
	switch m.state {
	case stateInitial:
		m.state = stateAfterFirstFind
		return entity.User{}, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	default:
		return m.existingUser, nil
	}
}

func (m *raceConditionNoUpdateMockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

func (m *raceConditionNoUpdateMockUserRepo) Create(ctx context.Context, user *entity.User) error {
	m.state = stateAfterCreateAttempt
	return errors.New("duplicate key")
}

func (m *raceConditionNoUpdateMockUserRepo) Update(ctx context.Context, user entity.User) error {
	m.updateCalled = true
	return nil
}

func (m *raceConditionNoUpdateMockUserRepo) UpdateRole(ctx context.Context, userID string, role string) error {
	return nil
}
