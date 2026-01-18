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

// --- GetReviewsByStoreID Tests ---

func TestGetReviewsByStoreID_Success(t *testing.T) {
	reviews := []entity.Review{
		{ReviewID: "review-1", StoreID: "store-1", Rating: 5},
		{ReviewID: "review-2", StoreID: "store-1", Rating: 4},
	}
	reviewRepo := &testutil.MockReviewRepository{FindByStoreIDResult: reviews}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	result, err := uc.GetReviewsByStoreID(context.Background(), "store-1", "", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 reviews, got %d", len(result))
	}
}

func TestGetReviewsByStoreID_StoreNotFound(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	_, err := uc.GetReviewsByStoreID(context.Background(), "nonexistent", "", "")
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestGetReviewsByStoreID_SortOptions(t *testing.T) {
	tests := []struct {
		name string
		sort string
	}{
		{"default sort (new)", ""},
		{"sort by new", "new"},
		{"sort by liked", "liked"},
		{"invalid sort defaults to new", "invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reviews := []entity.Review{{ReviewID: "review-1"}}
			reviewRepo := &testutil.MockReviewRepository{FindByStoreIDResult: reviews}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			_, err := uc.GetReviewsByStoreID(context.Background(), "store-1", tt.sort, "")
			if err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestGetReviewsByStoreID_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{FindByIDErr: dbErr}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	_, err := uc.GetReviewsByStoreID(context.Background(), "store-1", "", "")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- Create Tests ---

func TestCreate_Success(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating: 5,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreate_InvalidInput(t *testing.T) {
	tests := []struct {
		name    string
		storeID string
		userID  string
	}{
		{"empty storeID", "", "user-1"},
		{"empty userID", "store-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reviewRepo := &testutil.MockReviewRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.Create(context.Background(), tt.storeID, tt.userID, input.CreateReview{
				Rating: 5,
			})
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestCreate_StoreNotFound(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "nonexistent", "user-1", input.CreateReview{
		Rating: 5,
	})
	if !errors.Is(err, usecase.ErrStoreNotFound) {
		t.Errorf("expected ErrStoreNotFound, got %v", err)
	}
}

func TestCreate_InvalidRating(t *testing.T) {
	tests := []struct {
		name   string
		rating int
	}{
		{"rating too low", 0},
		{"rating negative", -1},
		{"rating too high", 6},
		{"rating way too high", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reviewRepo := &testutil.MockReviewRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
				Rating: tt.rating,
			})
			if !errors.Is(err, usecase.ErrInvalidRating) {
				t.Errorf("expected ErrInvalidRating for rating %d, got %v", tt.rating, err)
			}
		})
	}
}

func TestCreate_ValidRatings(t *testing.T) {
	for rating := 1; rating <= 5; rating++ {
		t.Run("rating "+string(rune('0'+rating)), func(t *testing.T) {
			reviewRepo := &testutil.MockReviewRepository{}
			storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
				Rating: rating,
			})
			if err != nil {
				t.Errorf("expected no error for rating %d, got %v", rating, err)
			}
		})
	}
}

func TestCreate_InvalidMenuIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{
		FindByStoreAndIDsResult: []entity.Menu{}, // returns empty but we requested menu-1
	}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		MenuIDs: []string{"menu-1"},
	})
	if !errors.Is(err, usecase.ErrInvalidInput) {
		t.Errorf("expected ErrInvalidInput, got %v", err)
	}
}

func TestCreate_InvalidFileIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{
		FindByStoreAndIDsResult: []entity.File{}, // returns empty but we requested file-1
	}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		FileIDs: []string{"file-1"},
	})
	if !errors.Is(err, usecase.ErrInvalidFileIDs) {
		t.Errorf("expected ErrInvalidFileIDs, got %v", err)
	}
}

func TestCreate_TransactionNil(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, nil)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating: 5,
	})
	if !errors.Is(err, output.ErrInvalidTransaction) {
		t.Errorf("expected ErrInvalidTransaction, got %v", err)
	}
}

func TestCreate_WithMenusAndFiles(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{
		FindByStoreAndIDsResult: []entity.Menu{
			{MenuID: "menu-1"},
			{MenuID: "menu-2"},
		},
	}
	fileRepo := &testutil.MockFileRepository{
		FindByStoreAndIDsResult: []entity.File{
			{FileID: "file-1"},
		},
	}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		MenuIDs: []string{"menu-1", "menu-2"},
		FileIDs: []string{"file-1"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreate_TransactionError(t *testing.T) {
	txnErr := errors.New("transaction error")
	reviewRepo := &testutil.MockReviewRepository{CreateInTxErr: txnErr}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating: 5,
	})
	if !errors.Is(err, txnErr) {
		t.Errorf("expected transaction error, got %v", err)
	}
}

// --- LikeReview Tests ---

func TestLikeReview_Success(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDResult: &entity.Review{ReviewID: "review-1"},
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "review-1", "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestLikeReview_InvalidInput(t *testing.T) {
	tests := []struct {
		name     string
		reviewID string
		userID   string
	}{
		{"empty reviewID", "", "user-1"},
		{"empty userID", "review-1", ""},
		{"both empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reviewRepo := &testutil.MockReviewRepository{}
			storeRepo := &testutil.MockStoreRepository{}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.LikeReview(context.Background(), tt.reviewID, tt.userID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestLikeReview_ReviewNotFound(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "nonexistent", "user-1")
	if !errors.Is(err, usecase.ErrReviewNotFound) {
		t.Errorf("expected ErrReviewNotFound, got %v", err)
	}
}

func TestLikeReview_AddLikeError(t *testing.T) {
	likeErr := errors.New("add like error")
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDResult: &entity.Review{ReviewID: "review-1"},
		AddLikeErr:     likeErr,
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, likeErr) {
		t.Errorf("expected add like error, got %v", err)
	}
}

// --- UnlikeReview Tests ---

func TestUnlikeReview_Success(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDResult: &entity.Review{ReviewID: "review-1"},
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "review-1", "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestUnlikeReview_InvalidInput(t *testing.T) {
	tests := []struct {
		name     string
		reviewID string
		userID   string
	}{
		{"empty reviewID", "", "user-1"},
		{"empty userID", "review-1", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reviewRepo := &testutil.MockReviewRepository{}
			storeRepo := &testutil.MockStoreRepository{}
			menuRepo := &testutil.MockMenuRepository{}
			fileRepo := &testutil.MockFileRepository{}
			txn := &testutil.MockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.UnlikeReview(context.Background(), tt.reviewID, tt.userID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestUnlikeReview_ReviewNotFound(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "nonexistent", "user-1")
	if !errors.Is(err, usecase.ErrReviewNotFound) {
		t.Errorf("expected ErrReviewNotFound, got %v", err)
	}
}

func TestUnlikeReview_RemoveLikeError(t *testing.T) {
	unlikeErr := errors.New("remove like error")
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDResult: &entity.Review{ReviewID: "review-1"},
		RemoveLikeErr:  unlikeErr,
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, unlikeErr) {
		t.Errorf("expected remove like error, got %v", err)
	}
}

// --- Additional Edge Case Tests ---

func TestLikeReview_RepositoryError(t *testing.T) {
	dbErr := errors.New("database connection error")
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDErr: dbErr, // non-NotFound error
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

func TestUnlikeReview_RepositoryError(t *testing.T) {
	dbErr := errors.New("database connection error")
	reviewRepo := &testutil.MockReviewRepository{
		FindByIDErr: dbErr, // non-NotFound error
	}
	storeRepo := &testutil.MockStoreRepository{}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

func TestCreate_MenuRepoError(t *testing.T) {
	dbErr := errors.New("menu database error")
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{
		FindByStoreAndIDsErr: dbErr,
	}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		MenuIDs: []string{"menu-1"},
	})
	if !errors.Is(err, dbErr) {
		t.Errorf("expected menu database error, got %v", err)
	}
}

func TestCreate_FileRepoError(t *testing.T) {
	dbErr := errors.New("file database error")
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{
		FindByStoreAndIDsErr: dbErr,
	}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		FileIDs: []string{"file-1"},
	})
	if !errors.Is(err, dbErr) {
		t.Errorf("expected file database error, got %v", err)
	}
}

func TestCreate_DeduplicatesMenuIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{
		FindByStoreAndIDsResult: []entity.Menu{
			{MenuID: "menu-1"},
		},
	}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	// Pass duplicate menu IDs - should be deduplicated to 1
	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		MenuIDs: []string{"menu-1", "menu-1", "menu-1"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreate_DeduplicatesFileIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{
		FindByStoreAndIDsResult: []entity.File{
			{FileID: "file-1"},
		},
	}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	// Pass duplicate file IDs - should be deduplicated to 1
	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		FileIDs: []string{"file-1", "file-1", "file-1"},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreate_SkipsEmptyMenuIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{
		FindByStoreAndIDsResult: []entity.Menu{
			{MenuID: "menu-1"},
		},
	}
	fileRepo := &testutil.MockFileRepository{}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	// Pass menu IDs with empty strings - should be filtered out
	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		MenuIDs: []string{"", "menu-1", ""},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreate_SkipsEmptyFileIDs(t *testing.T) {
	reviewRepo := &testutil.MockReviewRepository{}
	storeRepo := &testutil.MockStoreRepository{Store: &entity.Store{StoreID: "store-1"}}
	menuRepo := &testutil.MockMenuRepository{}
	fileRepo := &testutil.MockFileRepository{
		FindByStoreAndIDsResult: []entity.File{
			{FileID: "file-1"},
		},
	}
	txn := &testutil.MockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	// Pass file IDs with empty strings - should be filtered out
	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating:  5,
		FileIDs: []string{"", "file-1", ""},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
