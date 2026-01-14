package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// mockFavoriteRepository implements output.FavoriteRepository for testing
type mockFavoriteRepository struct {
	findByUserIDResult     []entity.Favorite
	findByUserIDErr        error
	findByUserAndStoreResult *entity.Favorite
	findByUserAndStoreErr    error
	createErr              error
	deleteErr              error
}

func (m *mockFavoriteRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Favorite, error) {
	if m.findByUserIDErr != nil {
		return nil, m.findByUserIDErr
	}
	return m.findByUserIDResult, nil
}

func (m *mockFavoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	if m.findByUserAndStoreErr != nil {
		return nil, m.findByUserAndStoreErr
	}
	return m.findByUserAndStoreResult, nil
}

func (m *mockFavoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	return m.createErr
}

func (m *mockFavoriteRepository) Delete(ctx context.Context, userID string, storeID string) error {
	return m.deleteErr
}

// mockUserRepoForFavorite implements output.UserRepository for favorite tests
type mockUserRepoForFavorite struct {
	findByIDResult entity.User
	findByIDErr    error
}

func (m *mockUserRepoForFavorite) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserRepoForFavorite) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepoForFavorite) Create(ctx context.Context, user *entity.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepoForFavorite) Update(ctx context.Context, user entity.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepoForFavorite) UpdateRole(ctx context.Context, userID string, role string) error {
	return errors.New("not implemented")
}

// mockStoreRepoForFavorite implements output.StoreRepository for favorite tests
type mockStoreRepoForFavorite struct {
	findByIDResult *entity.Store
	findByIDErr    error
}

func (m *mockStoreRepoForFavorite) FindAll(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForFavorite) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockStoreRepoForFavorite) FindPending(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForFavorite) Create(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForFavorite) Update(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForFavorite) Delete(ctx context.Context, id string) error {
	return errors.New("not implemented")
}

// --- GetUserFavorites Tests ---

func TestGetUserFavorites_Success(t *testing.T) {
	favorites := []entity.Favorite{
		{UserID: "user-1", StoreID: "store-1"},
		{UserID: "user-1", StoreID: "store-2"},
	}
	favoriteRepo := &mockFavoriteRepository{findByUserIDResult: favorites}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.GetUserFavorites(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 favorites, got %d", len(result))
	}
}

func TestGetUserFavorites_UserNotFound(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{}
	userRepo := &mockUserRepoForFavorite{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.GetUserFavorites(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestGetUserFavorites_EmptyFavorites(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{findByUserIDResult: []entity.Favorite{}}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.GetUserFavorites(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected 0 favorites, got %d", len(result))
	}
}

func TestGetUserFavorites_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &mockFavoriteRepository{findByUserIDErr: dbErr}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.GetUserFavorites(context.Background(), "user-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- AddFavorite Tests ---

func TestAddFavorite_Success(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.AddFavorite(context.Background(), "user-1", "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", result.UserID)
	}
	if result.StoreID != "store-1" {
		t.Errorf("expected StoreID store-1, got %s", result.StoreID)
	}
}

func TestAddFavorite_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		storeID string
	}{
		{"empty userID", "", "store-1"},
		{"empty storeID", "user-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			favoriteRepo := &mockFavoriteRepository{}
			userRepo := &mockUserRepoForFavorite{}
			storeRepo := &mockStoreRepoForFavorite{}

			uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

			_, err := uc.AddFavorite(context.Background(), tt.userID, tt.storeID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestAddFavorite_UserNotFound(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{}
	userRepo := &mockUserRepoForFavorite{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "nonexistent", "store-1")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestAddFavorite_StoreNotFound(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", "nonexistent")
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestAddFavorite_AlreadyExists(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: "store-1"},
	}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", "store-1")
	if !errors.Is(err, usecase.ErrAlreadyFavorite) {
		t.Errorf("expected ErrAlreadyFavorite, got %v", err)
	}
}

func TestAddFavorite_CreateError(t *testing.T) {
	createErr := errors.New("create error")
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
		createErr:             createErr,
	}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", "store-1")
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

func TestAddFavorite_FindByUserAndStoreError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreErr: dbErr,
	}
	userRepo := &mockUserRepoForFavorite{findByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &mockStoreRepoForFavorite{findByIDResult: &entity.Store{StoreID: "store-1"}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", "store-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- RemoveFavorite Tests ---

func TestRemoveFavorite_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		storeID string
	}{
		{"empty userID", "", "store-1"},
		{"empty storeID", "user-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			favoriteRepo := &mockFavoriteRepository{}
			userRepo := &mockUserRepoForFavorite{}
			storeRepo := &mockStoreRepoForFavorite{}

			uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

			err := uc.RemoveFavorite(context.Background(), tt.userID, tt.storeID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestRemoveFavorite_Success(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: "store-1"},
	}
	userRepo := &mockUserRepoForFavorite{}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", "store-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRemoveFavorite_NotFound(t *testing.T) {
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	userRepo := &mockUserRepoForFavorite{}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", "nonexistent")
	if !errors.Is(err, usecase.ErrFavoriteNotFound) {
		t.Errorf("expected ErrFavoriteNotFound, got %v", err)
	}
}

func TestRemoveFavorite_DeleteError(t *testing.T) {
	deleteErr := errors.New("delete error")
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: "store-1"},
		deleteErr:                deleteErr,
	}
	userRepo := &mockUserRepoForFavorite{}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", "store-1")
	if !errors.Is(err, deleteErr) {
		t.Errorf("expected delete error, got %v", err)
	}
}

func TestRemoveFavorite_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &mockFavoriteRepository{
		findByUserAndStoreErr: dbErr,
	}
	userRepo := &mockUserRepoForFavorite{}
	storeRepo := &mockStoreRepoForFavorite{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", "store-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}
