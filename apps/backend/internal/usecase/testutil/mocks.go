package testutil

import (
	"context"
	"fmt"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// MockStoreRepository implements output.StoreRepository for testing
type MockStoreRepository struct {
	Stores       []entity.Store
	FindAllErr   error
	FindByIDErr  error
	FindPendingErr error
	CreateErr    error
	UpdateErr    error
	DeleteErr    error
}

func (m *MockStoreRepository) FindAll(ctx context.Context) ([]entity.Store, error) {
	if m.FindAllErr != nil {
		return nil, m.FindAllErr
	}
	return m.Stores, nil
}

func (m *MockStoreRepository) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	for i := range m.Stores {
		if m.Stores[i].StoreID == id {
			return &m.Stores[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockStoreRepository) FindPending(ctx context.Context) ([]entity.Store, error) {
	if m.FindPendingErr != nil {
		return nil, m.FindPendingErr
	}
	var pending []entity.Store
	for _, s := range m.Stores {
		if !s.IsApproved {
			pending = append(pending, s)
		}
	}
	return pending, nil
}

func (m *MockStoreRepository) Create(ctx context.Context, store *entity.Store) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	store.StoreID = fmt.Sprintf("store-%d", len(m.Stores)+1)
	m.Stores = append(m.Stores, *store)
	return nil
}

func (m *MockStoreRepository) Update(ctx context.Context, store *entity.Store) error {
	if m.UpdateErr != nil {
		return m.UpdateErr
	}
	for i := range m.Stores {
		if m.Stores[i].StoreID == store.StoreID {
			m.Stores[i] = *store
			return nil
		}
	}
	return nil
}

func (m *MockStoreRepository) Delete(ctx context.Context, id string) error {
	if m.DeleteErr != nil {
		return m.DeleteErr
	}
	return nil
}

// MockReviewRepository implements output.ReviewRepository for testing
type MockReviewRepository struct {
	Reviews           []entity.Review
	FindByStoreIDErr  error
	FindByIDErr       error
	FindByUserIDErr   error
	CreateInTxErr     error
	AddLikeErr        error
	RemoveLikeErr     error
}

func (m *MockReviewRepository) FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	if m.FindByStoreIDErr != nil {
		return nil, m.FindByStoreIDErr
	}
	var result []entity.Review
	for _, r := range m.Reviews {
		if r.StoreID == storeID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (m *MockReviewRepository) FindByID(ctx context.Context, reviewID string) (*entity.Review, error) {
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	for i := range m.Reviews {
		if m.Reviews[i].ReviewID == reviewID {
			return &m.Reviews[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockReviewRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Review, error) {
	if m.FindByUserIDErr != nil {
		return nil, m.FindByUserIDErr
	}
	var result []entity.Review
	for _, r := range m.Reviews {
		if r.UserID == userID {
			result = append(result, r)
		}
	}
	return result, nil
}

func (m *MockReviewRepository) CreateInTx(ctx context.Context, tx interface{}, review output.CreateReview) error {
	return m.CreateInTxErr
}

func (m *MockReviewRepository) AddLike(ctx context.Context, reviewID string, userID string) error {
	return m.AddLikeErr
}

func (m *MockReviewRepository) RemoveLike(ctx context.Context, reviewID string, userID string) error {
	return m.RemoveLikeErr
}

// MockMenuRepository implements output.MenuRepository for testing
type MockMenuRepository struct {
	Menus                []entity.Menu
	FindByStoreIDErr     error
	FindByStoreAndIDsErr error
	CreateErr            error
}

func (m *MockMenuRepository) FindByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	if m.FindByStoreIDErr != nil {
		return nil, m.FindByStoreIDErr
	}
	var result []entity.Menu
	for _, menu := range m.Menus {
		if menu.StoreID == storeID {
			result = append(result, menu)
		}
	}
	return result, nil
}

func (m *MockMenuRepository) FindByStoreAndIDs(ctx context.Context, storeID string, menuIDs []string) ([]entity.Menu, error) {
	if m.FindByStoreAndIDsErr != nil {
		return nil, m.FindByStoreAndIDsErr
	}
	var result []entity.Menu
	for _, menu := range m.Menus {
		if menu.StoreID == storeID {
			for _, id := range menuIDs {
				if menu.MenuID == id {
					result = append(result, menu)
					break
				}
			}
		}
	}
	return result, nil
}

func (m *MockMenuRepository) Create(ctx context.Context, menu *entity.Menu) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Menus = append(m.Menus, *menu)
	return nil
}

// MockFileRepository implements output.FileRepository for testing
type MockFileRepository struct {
	Files                []entity.File
	FindByStoreAndIDsErr error
	CreateErr            error
	LinkToStoreErr       error
}

func (m *MockFileRepository) FindByStoreAndIDs(ctx context.Context, storeID string, fileIDs []string) ([]entity.File, error) {
	if m.FindByStoreAndIDsErr != nil {
		return nil, m.FindByStoreAndIDsErr
	}
	var result []entity.File
	for _, file := range m.Files {
		for _, id := range fileIDs {
			if file.FileID == id {
				result = append(result, file)
				break
			}
		}
	}
	return result, nil
}

func (m *MockFileRepository) Create(ctx context.Context, file *entity.File) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Files = append(m.Files, *file)
	return nil
}

func (m *MockFileRepository) LinkToStore(ctx context.Context, storeID string, fileID string) error {
	return m.LinkToStoreErr
}

// MockUserRepository implements output.UserRepository for testing
type MockUserRepository struct {
	Users          []entity.User
	FindByIDErr    error
	FindByEmailErr error
	CreateErr      error
	UpdateErr      error
	UpdateRoleErr  error
}

func (m *MockUserRepository) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.FindByIDErr != nil {
		return entity.User{}, m.FindByIDErr
	}
	for i := range m.Users {
		if m.Users[i].UserID == userID {
			return m.Users[i], nil
		}
	}
	return entity.User{}, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	if m.FindByEmailErr != nil {
		return nil, m.FindByEmailErr
	}
	for i := range m.Users {
		if m.Users[i].Email == email {
			return &m.Users[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockUserRepository) Create(ctx context.Context, user *entity.User) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Users = append(m.Users, *user)
	return nil
}

func (m *MockUserRepository) Update(ctx context.Context, user *entity.User) error {
	if m.UpdateErr != nil {
		return m.UpdateErr
	}
	for i := range m.Users {
		if m.Users[i].UserID == user.UserID {
			m.Users[i] = *user
			return nil
		}
	}
	return nil
}

func (m *MockUserRepository) UpdateRole(ctx context.Context, userID string, role string) error {
	if m.UpdateRoleErr != nil {
		return m.UpdateRoleErr
	}
	for i := range m.Users {
		if m.Users[i].UserID == userID {
			m.Users[i].Role = role
			return nil
		}
	}
	return nil
}

// MockFavoriteRepository implements output.FavoriteRepository for testing
type MockFavoriteRepository struct {
	Favorites           []entity.Favorite
	FindByUserIDErr     error
	FindByUserAndStoreErr error
	CreateErr           error
	DeleteErr           error
}

func (m *MockFavoriteRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Favorite, error) {
	if m.FindByUserIDErr != nil {
		return nil, m.FindByUserIDErr
	}
	var result []entity.Favorite
	for _, f := range m.Favorites {
		if f.UserID == userID {
			result = append(result, f)
		}
	}
	return result, nil
}

func (m *MockFavoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	if m.FindByUserAndStoreErr != nil {
		return nil, m.FindByUserAndStoreErr
	}
	for i := range m.Favorites {
		if m.Favorites[i].UserID == userID && m.Favorites[i].StoreID == storeID {
			return &m.Favorites[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockFavoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	m.Favorites = append(m.Favorites, *favorite)
	return nil
}

func (m *MockFavoriteRepository) Delete(ctx context.Context, userID string, storeID string) error {
	return m.DeleteErr
}

// MockTransaction implements output.Transaction for testing
type MockTransaction struct {
	StartErr error
}

func (m *MockTransaction) StartTransaction(fn func(interface{}) error) error {
	if m.StartErr != nil {
		return m.StartErr
	}
	return fn(nil)
}

// MockReportRepository implements output.ReportRepository for testing
type MockReportRepository struct {
	Reports         []entity.Report
	FindAllErr      error
	FindByIDErr     error
	CreateErr       error
	UpdateStatusErr error
}

func (m *MockReportRepository) FindAll(ctx context.Context) ([]entity.Report, error) {
	if m.FindAllErr != nil {
		return nil, m.FindAllErr
	}
	return m.Reports, nil
}

func (m *MockReportRepository) FindByID(ctx context.Context, reportID int64) (*entity.Report, error) {
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	for i := range m.Reports {
		if m.Reports[i].ReportID == reportID {
			return &m.Reports[i], nil
		}
	}
	return nil, apperr.New(apperr.CodeNotFound, entity.ErrNotFound)
}

func (m *MockReportRepository) Create(ctx context.Context, report *entity.Report) error {
	if m.CreateErr != nil {
		return m.CreateErr
	}
	report.ReportID = int64(len(m.Reports) + 1)
	m.Reports = append(m.Reports, *report)
	return nil
}

func (m *MockReportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	return m.UpdateStatusErr
}
