package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

const testFavoriteStoreID = "store-1"

// --- GetMyFavorites Tests ---

func TestGetMyFavorites_Success(t *testing.T) {
	favorites := []entity.Favorite{
		{UserID: "user-1", StoreID: testFavoriteStoreID},
		{UserID: "user-1", StoreID: "store-2"},
	}
	favoriteRepo := &testutil.MockFavoriteRepository{FindByUserIDResult: favorites}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.GetMyFavorites(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 favorites, got %d", len(result))
	}
}

func TestGetMyFavorites_UserNotFound(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{}
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.GetMyFavorites(context.Background(), "nonexistent")
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestGetMyFavorites_EmptyFavorites(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{FindByUserIDResult: []entity.Favorite{}}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.GetMyFavorites(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected 0 favorites, got %d", len(result))
	}
}

func TestGetMyFavorites_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &testutil.MockFavoriteRepository{FindByUserIDErr: dbErr}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.GetMyFavorites(context.Background(), "user-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- AddFavorite Tests ---

func TestAddFavorite_Success(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: testFavoriteStoreID}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	result, err := uc.AddFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", result.UserID)
	}
	if result.StoreID != testFavoriteStoreID {
		t.Errorf("expected StoreID %s, got %s", testFavoriteStoreID, result.StoreID)
	}
}

func TestAddFavorite_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		storeID string
	}{
		{"empty userID", "", testFavoriteStoreID},
		{"empty storeID", "user-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			favoriteRepo := &testutil.MockFavoriteRepository{}
			userRepo := &testutil.MockUserRepository{}
			storeRepo := &testutil.MockStoreRepository{}

			uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

			_, err := uc.AddFavorite(context.Background(), tt.userID, tt.storeID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestAddFavorite_UserNotFound(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{}
	userRepo := &testutil.MockUserRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "nonexistent", testFavoriteStoreID)
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestAddFavorite_StoreNotFound(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", "nonexistent")
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestAddFavorite_AlreadyExists(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: testFavoriteStoreID},
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: testFavoriteStoreID}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if !errors.Is(err, usecase.ErrAlreadyFavorite) {
		t.Errorf("expected ErrAlreadyFavorite, got %v", err)
	}
}

func TestAddFavorite_CreateError(t *testing.T) {
	createErr := errors.New("create error")
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
		CreateErr:             createErr,
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: testFavoriteStoreID}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

func TestAddFavorite_FindByUserAndStoreError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreErr: dbErr,
	}
	userRepo := &testutil.MockUserRepository{FindByIDResult: entity.User{UserID: "user-1"}}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: testFavoriteStoreID}}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	_, err := uc.AddFavorite(context.Background(), "user-1", testFavoriteStoreID)
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
		{"empty userID", "", testFavoriteStoreID},
		{"empty storeID", "user-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			favoriteRepo := &testutil.MockFavoriteRepository{}
			userRepo := &testutil.MockUserRepository{}
			storeRepo := &testutil.MockStoreRepository{}

			uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

			err := uc.RemoveFavorite(context.Background(), tt.userID, tt.storeID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestRemoveFavorite_Success(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: testFavoriteStoreID},
	}
	userRepo := &testutil.MockUserRepository{}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestRemoveFavorite_NotFound(t *testing.T) {
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	userRepo := &testutil.MockUserRepository{}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", "nonexistent")
	if !errors.Is(err, usecase.ErrFavoriteNotFound) {
		t.Errorf("expected ErrFavoriteNotFound, got %v", err)
	}
}

func TestRemoveFavorite_DeleteError(t *testing.T) {
	deleteErr := errors.New("delete error")
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreResult: &entity.Favorite{UserID: "user-1", StoreID: testFavoriteStoreID},
		DeleteErr:                deleteErr,
	}
	userRepo := &testutil.MockUserRepository{}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if !errors.Is(err, deleteErr) {
		t.Errorf("expected delete error, got %v", err)
	}
}

func TestRemoveFavorite_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	favoriteRepo := &testutil.MockFavoriteRepository{
		FindByUserAndStoreErr: dbErr,
	}
	userRepo := &testutil.MockUserRepository{}
	storeRepo := &testutil.MockStoreRepository{}

	uc := usecase.NewFavoriteUseCase(favoriteRepo, userRepo, storeRepo)

	err := uc.RemoveFavorite(context.Background(), "user-1", testFavoriteStoreID)
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}
