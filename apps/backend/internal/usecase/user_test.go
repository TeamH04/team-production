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

// mockUserRepository implements output.UserRepository for testing
type mockUserRepository struct {
	findByIDResult    entity.User
	findByIDErr       error
	findByEmailResult *entity.User
	findByEmailErr    error
	createErr         error
	updateErr         error
	updateRoleErr     error
	createCalled      bool
	updateCalled      bool
}

func (m *mockUserRepository) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	if m.findByEmailErr != nil {
		return nil, m.findByEmailErr
	}
	return m.findByEmailResult, nil
}

func (m *mockUserRepository) Create(ctx context.Context, user *entity.User) error {
	m.createCalled = true
	return m.createErr
}

func (m *mockUserRepository) Update(ctx context.Context, user entity.User) error {
	m.updateCalled = true
	if m.updateErr != nil {
		return m.updateErr
	}
	m.findByIDResult = user
	return nil
}

func (m *mockUserRepository) UpdateRole(ctx context.Context, userID string, role string) error {
	return m.updateRoleErr
}

// mockReviewRepoForUser implements output.ReviewRepository for user tests
type mockReviewRepoForUser struct {
	findByUserIDResult []entity.Review
	findByUserIDErr    error
}

func (m *mockReviewRepoForUser) FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	return nil, errors.New("not implemented")
}

func (m *mockReviewRepoForUser) FindByID(ctx context.Context, reviewID string) (*entity.Review, error) {
	return nil, errors.New("not implemented")
}

func (m *mockReviewRepoForUser) FindByUserID(ctx context.Context, userID string) ([]entity.Review, error) {
	if m.findByUserIDErr != nil {
		return nil, m.findByUserIDErr
	}
	return m.findByUserIDResult, nil
}

func (m *mockReviewRepoForUser) CreateInTx(ctx context.Context, tx interface{}, review output.CreateReview) error {
	return errors.New("not implemented")
}

func (m *mockReviewRepoForUser) AddLike(ctx context.Context, reviewID string, userID string) error {
	return errors.New("not implemented")
}

func (m *mockReviewRepoForUser) RemoveLike(ctx context.Context, reviewID string, userID string) error {
	return errors.New("not implemented")
}

// --- FindByID Tests ---

func TestFindByID_Success(t *testing.T) {
	expected := entity.User{UserID: "user-1", Name: "Test User", Email: "test@example.com"}
	userRepo := &mockUserRepository{findByIDResult: expected}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.FindByID(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestFindByID_RepositoryError(t *testing.T) {
	expectedErr := errors.New("database error")
	userRepo := &mockUserRepository{findByIDErr: expectedErr}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

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
	if userRepo.updateCalled {
		t.Error("expected Update not to be called when provider is the same")
	}
}

func TestEnsureUser_ExistingUser_ProviderUpdate(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth",
	}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

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
	if !userRepo.updateCalled {
		t.Error("expected Update to be called when provider is upgraded from oauth")
	}
}

func TestEnsureUser_ExistingUser_ProfileUpdate(t *testing.T) {
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
	}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
		Name:     "Google User",
		IconURL:  "https://example.com/icon.png",
		Gender:   "female",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "Google User" {
		t.Errorf("expected Name to be updated to Google User, got %s", result.Name)
	}
	if result.IconURL == nil || *result.IconURL != "https://example.com/icon.png" {
		t.Error("expected IconURL to be set from claims")
	}
	if result.Gender == nil || *result.Gender != "female" {
		t.Error("expected Gender to be set from claims")
	}
	if !userRepo.updateCalled {
		t.Error("expected Update to be called when profile fields are missing")
	}
}

func TestEnsureUser_ExistingUser_NoProfileOverride(t *testing.T) {
	iconFileID := "file-1"
	existingGender := "male"
	existingUser := entity.User{
		UserID:     "user-1",
		Name:       "Existing User",
		Email:      "test@example.com",
		Provider:   "google",
		IconFileID: &iconFileID,
		Gender:     &existingGender,
	}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "google",
		Name:     "New Name",
		IconURL:  "https://example.com/new-icon.png",
		Gender:   "female",
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
	if result.Gender == nil || *result.Gender != "male" {
		t.Error("expected Gender to remain unchanged")
	}
	if userRepo.updateCalled {
		t.Error("expected Update not to be called when profile fields already exist")
	}
}

func TestEnsureUser_NewUser_Success(t *testing.T) {
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

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
	if !userRepo.createCalled {
		t.Error("expected Create to be called for new user")
	}
}

func TestEnsureUser_NewUser_UsesProvidedProfile(t *testing.T) {
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	result, err := uc.EnsureUser(context.Background(), input.EnsureUserInput{
		UserID:   "new-user-2",
		Email:    "profile@example.com",
		Provider: "google",
		Role:     "user",
		Name:     "Profile Name",
		IconURL:  "https://example.com/icon.png",
		Gender:   "female",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Name != "Profile Name" {
		t.Errorf("expected Name to use provided value, got %s", result.Name)
	}
	if result.IconURL == nil || *result.IconURL != "https://example.com/icon.png" {
		t.Error("expected IconURL to use provided value")
	}
	if result.Gender == nil || *result.Gender != "female" {
		t.Error("expected Gender to use provided value")
	}
	if !userRepo.createCalled {
		t.Error("expected Create to be called for new user")
	}
}

func TestEnsureUser_InvalidInput_EmptyUserID(t *testing.T) {
	userRepo := &mockUserRepository{}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

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
	existingUser := entity.User{
		UserID:   "user-1",
		Email:    "test@example.com",
		Provider: "oauth",
	}
	callCount := 0
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
		createErr:   errors.New("duplicate key"),
	}
	// Override FindByID to return existing user on second call (simulating race condition)
	originalFindByID := userRepo.findByIDErr
	userRepo.findByIDErr = originalFindByID
	userRepo.findByIDResult = existingUser

	// Create a custom mock that changes behavior
	customRepo := &raceConditionMockUserRepo{
		callCount:    &callCount,
		existingUser: existingUser,
	}
	reviewRepo := &mockReviewRepoForUser{}

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

// Helper for race condition test
type raceConditionMockUserRepo struct {
	callCount    *int
	existingUser entity.User
}

func (m *raceConditionMockUserRepo) FindByID(ctx context.Context, userID string) (entity.User, error) {
	(*m.callCount)++
	if *m.callCount == 1 {
		return entity.User{}, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
	}
	return m.existingUser, nil
}

func (m *raceConditionMockUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

func (m *raceConditionMockUserRepo) Create(ctx context.Context, user *entity.User) error {
	return errors.New("duplicate key")
}

func (m *raceConditionMockUserRepo) Update(ctx context.Context, user entity.User) error {
	m.existingUser = user
	return nil
}

func (m *raceConditionMockUserRepo) UpdateRole(ctx context.Context, userID string, role string) error {
	return nil
}

// --- UpdateUser Tests ---

func TestUpdateUser_Success(t *testing.T) {
	existingUser := entity.User{
		UserID: "user-1",
		Name:   "Old Name",
		Email:  "test@example.com",
	}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := "New Name"
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
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := "New Name"
	_, err := uc.UpdateUser(context.Background(), "nonexistent", input.UpdateUserInput{
		Name: &newName,
	})
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestUpdateUser_PartialUpdate(t *testing.T) {
	iconURL := "https://example.com/icon.png"
	existingUser := entity.User{
		UserID:  "user-1",
		Name:    "Test User",
		Email:   "test@example.com",
		IconURL: &iconURL,
	}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{
		findByIDResult: existingUser,
		updateErr:      errors.New("database error"),
	}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	newName := "New Name"
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
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{}

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
			userRepo := &mockUserRepository{findByIDResult: existingUser}
			reviewRepo := &mockReviewRepoForUser{}

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
			userRepo := &mockUserRepository{findByIDResult: existingUser}
			reviewRepo := &mockReviewRepoForUser{}

			uc := usecase.NewUserUseCase(userRepo, reviewRepo)

			err := uc.UpdateUserRole(context.Background(), "user-1", role)
			if err != nil {
				t.Errorf("expected no error for valid role %q, got %v", role, err)
			}
		})
	}
}

func TestUpdateUserRole_UserNotFound(t *testing.T) {
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

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
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{findByUserIDResult: reviews}

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
	userRepo := &mockUserRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	reviewRepo := &mockReviewRepoForUser{}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.GetUserReviews(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestGetUserReviews_EmptyReviews(t *testing.T) {
	existingUser := entity.User{UserID: "user-1"}
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{findByUserIDResult: []entity.Review{}}

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
	userRepo := &mockUserRepository{findByIDResult: existingUser}
	reviewRepo := &mockReviewRepoForUser{findByUserIDErr: errors.New("database error")}

	uc := usecase.NewUserUseCase(userRepo, reviewRepo)

	_, err := uc.GetUserReviews(context.Background(), "user-1")
	if err == nil {
		t.Error("expected error from repository")
	}
}
