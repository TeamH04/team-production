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

// mockReviewRepository implements output.ReviewRepository for review tests
type mockReviewRepository struct {
	findByStoreIDResult []entity.Review
	findByStoreIDErr    error
	findByIDResult      *entity.Review
	findByIDErr         error
	createInTxErr       error
	addLikeErr          error
	removeLikeErr       error
}

func (m *mockReviewRepository) FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	if m.findByStoreIDErr != nil {
		return nil, m.findByStoreIDErr
	}
	return m.findByStoreIDResult, nil
}

func (m *mockReviewRepository) FindByID(ctx context.Context, reviewID string) (*entity.Review, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockReviewRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Review, error) {
	return nil, errors.New("not implemented")
}

func (m *mockReviewRepository) CreateInTx(ctx context.Context, tx interface{}, review output.CreateReview) error {
	return m.createInTxErr
}

func (m *mockReviewRepository) AddLike(ctx context.Context, reviewID string, userID string) error {
	return m.addLikeErr
}

func (m *mockReviewRepository) RemoveLike(ctx context.Context, reviewID string, userID string) error {
	return m.removeLikeErr
}

// mockStoreRepoForReview implements output.StoreRepository for review tests
type mockStoreRepoForReview struct {
	findByIDResult *entity.Store
	findByIDErr    error
}

func (m *mockStoreRepoForReview) FindAll(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForReview) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockStoreRepoForReview) FindPending(ctx context.Context) ([]entity.Store, error) {
	return nil, errors.New("not implemented")
}

func (m *mockStoreRepoForReview) Create(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForReview) Update(ctx context.Context, store *entity.Store) error {
	return errors.New("not implemented")
}

func (m *mockStoreRepoForReview) Delete(ctx context.Context, id string) error {
	return errors.New("not implemented")
}

// mockMenuRepoForReview implements output.MenuRepository for review tests
type mockMenuRepoForReview struct {
	findByStoreAndIDsResult []entity.Menu
	findByStoreAndIDsErr    error
}

func (m *mockMenuRepoForReview) FindByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	return nil, errors.New("not implemented")
}

func (m *mockMenuRepoForReview) FindByStoreAndIDs(ctx context.Context, storeID string, menuIDs []string) ([]entity.Menu, error) {
	if m.findByStoreAndIDsErr != nil {
		return nil, m.findByStoreAndIDsErr
	}
	return m.findByStoreAndIDsResult, nil
}

func (m *mockMenuRepoForReview) Create(ctx context.Context, menu *entity.Menu) error {
	return errors.New("not implemented")
}

// mockFileRepoForReview implements output.FileRepository for review tests
type mockFileRepoForReview struct {
	findByStoreAndIDsResult []entity.File
	findByStoreAndIDsErr    error
}

func (m *mockFileRepoForReview) FindByStoreAndIDs(ctx context.Context, storeID string, fileIDs []string) ([]entity.File, error) {
	if m.findByStoreAndIDsErr != nil {
		return nil, m.findByStoreAndIDsErr
	}
	return m.findByStoreAndIDsResult, nil
}

func (m *mockFileRepoForReview) Create(ctx context.Context, file *entity.File) error {
	return errors.New("not implemented")
}

func (m *mockFileRepoForReview) LinkToStore(ctx context.Context, storeID string, fileID string) error {
	return errors.New("not implemented")
}

// mockTransaction implements output.Transaction for review tests
type mockTransaction struct {
	startErr error
}

func (m *mockTransaction) StartTransaction(fn func(interface{}) error) error {
	if m.startErr != nil {
		return m.startErr
	}
	return fn(nil)
}

// --- GetReviewsByStoreID Tests ---

func TestGetReviewsByStoreID_Success(t *testing.T) {
	reviews := []entity.Review{
		{ReviewID: "review-1", StoreID: "store-1", Rating: 5},
		{ReviewID: "review-2", StoreID: "store-1", Rating: 4},
	}
	reviewRepo := &mockReviewRepository{findByStoreIDResult: reviews}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{findByStoreIDResult: reviews}
			storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDErr: dbErr}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	_, err := uc.GetReviewsByStoreID(context.Background(), "store-1", "", "")
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- Create Tests ---

func TestCreate_Success(t *testing.T) {
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{}
			storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{}
			storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{}
			storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{
		findByStoreAndIDsResult: []entity.Menu{}, // returns empty but we requested menu-1
	}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{
		findByStoreAndIDsResult: []entity.File{}, // returns empty but we requested file-1
	}
	txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, nil)

	err := uc.Create(context.Background(), "store-1", "user-1", input.CreateReview{
		Rating: 5,
	})
	if !errors.Is(err, output.ErrInvalidTransaction) {
		t.Errorf("expected ErrInvalidTransaction, got %v", err)
	}
}

func TestCreate_WithMenusAndFiles(t *testing.T) {
	reviewRepo := &mockReviewRepository{}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{
		findByStoreAndIDsResult: []entity.Menu{
			{MenuID: "menu-1"},
			{MenuID: "menu-2"},
		},
	}
	fileRepo := &mockFileRepoForReview{
		findByStoreAndIDsResult: []entity.File{
			{FileID: "file-1"},
		},
	}
	txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{createInTxErr: txnErr}
	storeRepo := &mockStoreRepoForReview{findByIDResult: &entity.Store{StoreID: "store-1"}}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
	reviewRepo := &mockReviewRepository{
		findByIDResult: &entity.Review{ReviewID: "review-1"},
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{}
			storeRepo := &mockStoreRepoForReview{}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.LikeReview(context.Background(), tt.reviewID, tt.userID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestLikeReview_ReviewNotFound(t *testing.T) {
	reviewRepo := &mockReviewRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "nonexistent", "user-1")
	if !errors.Is(err, usecase.ErrReviewNotFound) {
		t.Errorf("expected ErrReviewNotFound, got %v", err)
	}
}

func TestLikeReview_AddLikeError(t *testing.T) {
	likeErr := errors.New("add like error")
	reviewRepo := &mockReviewRepository{
		findByIDResult: &entity.Review{ReviewID: "review-1"},
		addLikeErr:     likeErr,
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.LikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, likeErr) {
		t.Errorf("expected add like error, got %v", err)
	}
}

// --- UnlikeReview Tests ---

func TestUnlikeReview_Success(t *testing.T) {
	reviewRepo := &mockReviewRepository{
		findByIDResult: &entity.Review{ReviewID: "review-1"},
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

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
			reviewRepo := &mockReviewRepository{}
			storeRepo := &mockStoreRepoForReview{}
			menuRepo := &mockMenuRepoForReview{}
			fileRepo := &mockFileRepoForReview{}
			txn := &mockTransaction{}

			uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

			err := uc.UnlikeReview(context.Background(), tt.reviewID, tt.userID)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestUnlikeReview_ReviewNotFound(t *testing.T) {
	reviewRepo := &mockReviewRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "nonexistent", "user-1")
	if !errors.Is(err, usecase.ErrReviewNotFound) {
		t.Errorf("expected ErrReviewNotFound, got %v", err)
	}
}

func TestUnlikeReview_RemoveLikeError(t *testing.T) {
	unlikeErr := errors.New("remove like error")
	reviewRepo := &mockReviewRepository{
		findByIDResult: &entity.Review{ReviewID: "review-1"},
		removeLikeErr:  unlikeErr,
	}
	storeRepo := &mockStoreRepoForReview{}
	menuRepo := &mockMenuRepoForReview{}
	fileRepo := &mockFileRepoForReview{}
	txn := &mockTransaction{}

	uc := usecase.NewReviewUseCase(reviewRepo, storeRepo, menuRepo, fileRepo, txn)

	err := uc.UnlikeReview(context.Background(), "review-1", "user-1")
	if !errors.Is(err, unlikeErr) {
		t.Errorf("expected remove like error, got %v", err)
	}
}
