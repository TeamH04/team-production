package testutil

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// MockUserUseCase implements input.UserUseCase for testing
type MockUserUseCase struct {
	FindByIDResult     entity.User
	FindByIDErr        error
	EnsureUserResult   entity.User
	EnsureUserErr      error
	UpdateUserResult   entity.User
	UpdateUserErr      error
	UpdateUserRoleErr  error
	GetUserReviewsResult []entity.Review
	GetUserReviewsErr  error
}

func (m *MockUserUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.FindByIDErr != nil {
		return entity.User{}, m.FindByIDErr
	}
	return m.FindByIDResult, nil
}

func (m *MockUserUseCase) EnsureUser(ctx context.Context, in input.EnsureUserInput) (entity.User, error) {
	if m.EnsureUserErr != nil {
		return entity.User{}, m.EnsureUserErr
	}
	return m.EnsureUserResult, nil
}

func (m *MockUserUseCase) UpdateUser(ctx context.Context, userID string, in input.UpdateUserInput) (entity.User, error) {
	if m.UpdateUserErr != nil {
		return entity.User{}, m.UpdateUserErr
	}
	return m.UpdateUserResult, nil
}

func (m *MockUserUseCase) UpdateUserRole(ctx context.Context, userID string, role string) error {
	return m.UpdateUserRoleErr
}

func (m *MockUserUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	if m.GetUserReviewsErr != nil {
		return nil, m.GetUserReviewsErr
	}
	return m.GetUserReviewsResult, nil
}

// MockTokenVerifier implements security.TokenVerifier for testing
type MockTokenVerifier struct {
	Claims *security.TokenClaims
	Err    error
}

func (m *MockTokenVerifier) Verify(token string) (*security.TokenClaims, error) {
	if m.Err != nil {
		return nil, m.Err
	}
	return m.Claims, nil
}

// MockAuthUseCase implements input.AuthUseCase for testing
type MockAuthUseCase struct {
	SignupResult *entity.User
	SignupErr    error
	LoginResult  *input.AuthSession
	LoginErr     error
}

func (m *MockAuthUseCase) Signup(ctx context.Context, in input.AuthSignupInput) (*entity.User, error) {
	if m.SignupErr != nil {
		return nil, m.SignupErr
	}
	return m.SignupResult, nil
}

func (m *MockAuthUseCase) Login(ctx context.Context, in input.AuthLoginInput) (*input.AuthSession, error) {
	if m.LoginErr != nil {
		return nil, m.LoginErr
	}
	return m.LoginResult, nil
}

// MockReportUseCase implements input.ReportUseCase for testing
type MockReportUseCase struct {
	CreateResult    *entity.Report
	CreateErr       error
	GetAllResult    []entity.Report
	GetAllErr       error
	HandleReportErr error
}

func (m *MockReportUseCase) CreateReport(ctx context.Context, in input.CreateReportInput) (*entity.Report, error) {
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}

func (m *MockReportUseCase) GetAllReports(ctx context.Context) ([]entity.Report, error) {
	if m.GetAllErr != nil {
		return nil, m.GetAllErr
	}
	return m.GetAllResult, nil
}

func (m *MockReportUseCase) HandleReport(ctx context.Context, reportID int64, action input.HandleReportAction) error {
	return m.HandleReportErr
}

// MockAdminUseCase implements input.AdminUseCase for testing
type MockAdminUseCase struct {
	GetPendingResult []entity.Store
	GetPendingErr    error
	ApproveErr       error
	RejectErr        error
}

func (m *MockAdminUseCase) GetPendingStores(ctx context.Context) ([]entity.Store, error) {
	if m.GetPendingErr != nil {
		return nil, m.GetPendingErr
	}
	return m.GetPendingResult, nil
}

func (m *MockAdminUseCase) ApproveStore(ctx context.Context, storeID string) error {
	return m.ApproveErr
}

func (m *MockAdminUseCase) RejectStore(ctx context.Context, storeID string) error {
	return m.RejectErr
}

// MockReviewUseCase implements input.ReviewUseCase for testing
type MockReviewUseCase struct {
	GetByStoreIDResult []entity.Review
	GetByStoreIDErr    error
	CreateErr          error
	LikeErr            error
	UnlikeErr          error
}

func (m *MockReviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	if m.GetByStoreIDErr != nil {
		return nil, m.GetByStoreIDErr
	}
	return m.GetByStoreIDResult, nil
}

func (m *MockReviewUseCase) Create(ctx context.Context, storeID string, userID string, in input.CreateReview) error {
	return m.CreateErr
}

func (m *MockReviewUseCase) LikeReview(ctx context.Context, reviewID string, userID string) error {
	return m.LikeErr
}

func (m *MockReviewUseCase) UnlikeReview(ctx context.Context, reviewID string, userID string) error {
	return m.UnlikeErr
}

// MockFavoriteUseCase implements input.FavoriteUseCase for testing
type MockFavoriteUseCase struct {
	GetUserFavoritesResult []entity.Favorite
	GetUserFavoritesErr    error
	AddResult              *entity.Favorite
	AddErr                 error
	RemoveErr              error
}

func (m *MockFavoriteUseCase) GetUserFavorites(ctx context.Context, userID string) ([]entity.Favorite, error) {
	if m.GetUserFavoritesErr != nil {
		return nil, m.GetUserFavoritesErr
	}
	return m.GetUserFavoritesResult, nil
}

func (m *MockFavoriteUseCase) AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	if m.AddErr != nil {
		return nil, m.AddErr
	}
	return m.AddResult, nil
}

func (m *MockFavoriteUseCase) RemoveFavorite(ctx context.Context, userID string, storeID string) error {
	return m.RemoveErr
}

// MockMenuUseCase implements input.MenuUseCase for testing
type MockMenuUseCase struct {
	GetByStoreIDResult []entity.Menu
	GetByStoreIDErr    error
	CreateResult       *entity.Menu
	CreateErr          error
}

func (m *MockMenuUseCase) GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	if m.GetByStoreIDErr != nil {
		return nil, m.GetByStoreIDErr
	}
	return m.GetByStoreIDResult, nil
}

func (m *MockMenuUseCase) CreateMenu(ctx context.Context, storeID string, in input.CreateMenuInput) (*entity.Menu, error) {
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}

// MockMediaUseCase implements input.MediaUseCase for testing
type MockMediaUseCase struct {
	CreateResult []input.SignedUploadFile
	CreateErr    error
}

func (m *MockMediaUseCase) CreateReviewUploads(ctx context.Context, storeID string, userID string, files []input.UploadFileInput) ([]input.SignedUploadFile, error) {
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}
