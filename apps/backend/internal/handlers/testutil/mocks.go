package testutil

import (
	"context"
	"fmt"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/security"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// ============================================================================
// Repository Mocks
// ============================================================================

// MockStoreRepository implements output.StoreRepository for testing.
// Provides configurable return values and tracks method calls.
type MockStoreRepository struct {
	// Return values
	Stores         []entity.Store
	Store          *entity.Store
	FindAllErr     error
	FindByIDErr    error
	FindPendingErr error
	CreateErr      error
	UpdateErr      error
	DeleteErr      error

	// Call tracking
	FindAllCalled      bool
	FindByIDCalled     bool
	FindByIDCalledWith string
	FindPendingCalled  bool
	CreateCalled       bool
	CreateCalledWith   *entity.Store
	UpdateCalled       bool
	UpdateCalledWith   *entity.Store
	DeleteCalled       bool
	DeleteCalledWith   string
}

func (m *MockStoreRepository) FindAll(ctx context.Context) ([]entity.Store, error) {
	m.FindAllCalled = true
	if m.FindAllErr != nil {
		return nil, m.FindAllErr
	}
	return m.Stores, nil
}

func (m *MockStoreRepository) FindByID(ctx context.Context, id string) (*entity.Store, error) {
	m.FindByIDCalled = true
	m.FindByIDCalledWith = id
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	if m.Store != nil {
		return m.Store, nil
	}
	// Check in Stores slice
	for i := range m.Stores {
		if m.Stores[i].StoreID == id {
			return &m.Stores[i], nil
		}
	}
	return nil, nil
}

func (m *MockStoreRepository) FindPending(ctx context.Context) ([]entity.Store, error) {
	m.FindPendingCalled = true
	if m.FindPendingErr != nil {
		return nil, m.FindPendingErr
	}
	return m.Stores, nil
}

func (m *MockStoreRepository) Create(ctx context.Context, store *entity.Store) error {
	m.CreateCalled = true
	m.CreateCalledWith = store
	if m.CreateErr != nil {
		return m.CreateErr
	}
	if store.StoreID == "" {
		store.StoreID = fmt.Sprintf("store-%d", len(m.Stores)+1)
	}
	m.Stores = append(m.Stores, *store)
	return nil
}

func (m *MockStoreRepository) Update(ctx context.Context, store *entity.Store) error {
	m.UpdateCalled = true
	m.UpdateCalledWith = store
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
	m.DeleteCalled = true
	m.DeleteCalledWith = id
	return m.DeleteErr
}

// Reset clears all call tracking state
func (m *MockStoreRepository) Reset() {
	m.FindAllCalled = false
	m.FindByIDCalled = false
	m.FindByIDCalledWith = ""
	m.FindPendingCalled = false
	m.CreateCalled = false
	m.CreateCalledWith = nil
	m.UpdateCalled = false
	m.UpdateCalledWith = nil
	m.DeleteCalled = false
	m.DeleteCalledWith = ""
}

// MockUserRepository implements output.UserRepository for testing.
type MockUserRepository struct {
	// Return values
	FindByIDResult    entity.User
	FindByIDErr       error
	FindByEmailResult *entity.User
	FindByEmailErr    error
	CreateErr         error
	UpdateErr         error
	UpdateInTxErr     error
	UpdateRoleErr     error
	UpdateRoleInTxErr error

	// Call tracking
	FindByIDCalled        bool
	FindByIDCalledWith    string
	FindByEmailCalled     bool
	FindByEmailCalledWith string
	CreateCalled          bool
	CreateCalledWith      *entity.User
	UpdateCalled          bool
	UpdateCalledWith      entity.User
	UpdateInTxCalled      bool
	UpdateInTxCalledWith  struct {
		Tx   interface{}
		User entity.User
	}
	UpdateRoleCalled     bool
	UpdateRoleCalledWith struct {
		UserID string
		Role   string
	}
	UpdateRoleInTxCalled     bool
	UpdateRoleInTxCalledWith struct {
		Tx     interface{}
		UserID string
		Role   string
	}
}

func (m *MockUserRepository) FindByID(ctx context.Context, userID string) (entity.User, error) {
	m.FindByIDCalled = true
	m.FindByIDCalledWith = userID
	if m.FindByIDErr != nil {
		return entity.User{}, m.FindByIDErr
	}
	return m.FindByIDResult, nil
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	m.FindByEmailCalled = true
	m.FindByEmailCalledWith = email
	if m.FindByEmailErr != nil {
		return nil, m.FindByEmailErr
	}
	return m.FindByEmailResult, nil
}

func (m *MockUserRepository) Create(ctx context.Context, user *entity.User) error {
	m.CreateCalled = true
	m.CreateCalledWith = user
	return m.CreateErr
}

func (m *MockUserRepository) Update(ctx context.Context, user entity.User) error {
	m.UpdateCalled = true
	m.UpdateCalledWith = user
	if m.UpdateErr != nil {
		return m.UpdateErr
	}
	m.FindByIDResult = user
	return nil
}

func (m *MockUserRepository) UpdateInTx(ctx context.Context, tx interface{}, user entity.User) error {
	m.UpdateInTxCalled = true
	m.UpdateInTxCalledWith.Tx = tx
	m.UpdateInTxCalledWith.User = user
	if m.UpdateInTxErr != nil {
		return m.UpdateInTxErr
	}
	m.FindByIDResult = user
	return nil
}

func (m *MockUserRepository) UpdateRole(ctx context.Context, userID string, role string) error {
	m.UpdateRoleCalled = true
	m.UpdateRoleCalledWith.UserID = userID
	m.UpdateRoleCalledWith.Role = role
	return m.UpdateRoleErr
}

func (m *MockUserRepository) UpdateRoleInTx(ctx context.Context, tx interface{}, userID string, role string) error {
	m.UpdateRoleInTxCalled = true
	m.UpdateRoleInTxCalledWith.Tx = tx
	m.UpdateRoleInTxCalledWith.UserID = userID
	m.UpdateRoleInTxCalledWith.Role = role
	m.FindByIDResult.Role = role
	return m.UpdateRoleInTxErr
}

// Reset clears all call tracking state
func (m *MockUserRepository) Reset() {
	m.FindByIDCalled = false
	m.FindByIDCalledWith = ""
	m.FindByEmailCalled = false
	m.FindByEmailCalledWith = ""
	m.CreateCalled = false
	m.CreateCalledWith = nil
	m.UpdateCalled = false
	m.UpdateCalledWith = entity.User{}
	m.UpdateInTxCalled = false
	m.UpdateInTxCalledWith.Tx = nil
	m.UpdateInTxCalledWith.User = entity.User{}
	m.UpdateRoleCalled = false
	m.UpdateRoleCalledWith.UserID = ""
	m.UpdateRoleCalledWith.Role = ""
	m.UpdateRoleInTxCalled = false
	m.UpdateRoleInTxCalledWith.Tx = nil
	m.UpdateRoleInTxCalledWith.UserID = ""
	m.UpdateRoleInTxCalledWith.Role = ""
}

// MockReviewRepository implements output.ReviewRepository for testing.
type MockReviewRepository struct {
	// Return values
	FindByStoreIDResult []entity.Review
	FindByStoreIDErr    error
	FindByIDResult      *entity.Review
	FindByIDErr         error
	FindByUserIDResult  []entity.Review
	FindByUserIDErr     error
	CreateInTxErr       error
	AddLikeErr          error
	RemoveLikeErr       error

	// Call tracking
	FindByStoreIDCalled     bool
	FindByStoreIDCalledWith struct {
		StoreID  string
		Sort     string
		ViewerID string
	}
	FindByIDCalled         bool
	FindByIDCalledWith     string
	FindByUserIDCalled     bool
	FindByUserIDCalledWith string
	CreateInTxCalled       bool
	CreateInTxCalledWith   output.CreateReview
	AddLikeCalled          bool
	AddLikeCalledWith      struct{ ReviewID, UserID string }
	RemoveLikeCalled       bool
	RemoveLikeCalledWith   struct{ ReviewID, UserID string }
}

func (m *MockReviewRepository) FindByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	m.FindByStoreIDCalled = true
	m.FindByStoreIDCalledWith.StoreID = storeID
	m.FindByStoreIDCalledWith.Sort = sort
	m.FindByStoreIDCalledWith.ViewerID = viewerID
	if m.FindByStoreIDErr != nil {
		return nil, m.FindByStoreIDErr
	}
	return m.FindByStoreIDResult, nil
}

func (m *MockReviewRepository) FindByID(ctx context.Context, reviewID string) (*entity.Review, error) {
	m.FindByIDCalled = true
	m.FindByIDCalledWith = reviewID
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	return m.FindByIDResult, nil
}

func (m *MockReviewRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Review, error) {
	m.FindByUserIDCalled = true
	m.FindByUserIDCalledWith = userID
	if m.FindByUserIDErr != nil {
		return nil, m.FindByUserIDErr
	}
	return m.FindByUserIDResult, nil
}

func (m *MockReviewRepository) CreateInTx(ctx context.Context, tx interface{}, review output.CreateReview) error {
	m.CreateInTxCalled = true
	m.CreateInTxCalledWith = review
	return m.CreateInTxErr
}

func (m *MockReviewRepository) AddLike(ctx context.Context, reviewID string, userID string) error {
	m.AddLikeCalled = true
	m.AddLikeCalledWith.ReviewID = reviewID
	m.AddLikeCalledWith.UserID = userID
	return m.AddLikeErr
}

func (m *MockReviewRepository) RemoveLike(ctx context.Context, reviewID string, userID string) error {
	m.RemoveLikeCalled = true
	m.RemoveLikeCalledWith.ReviewID = reviewID
	m.RemoveLikeCalledWith.UserID = userID
	return m.RemoveLikeErr
}

// MockFavoriteRepository implements output.FavoriteRepository for testing.
type MockFavoriteRepository struct {
	// Return values
	FindByUserIDResult       []entity.Favorite
	FindByUserIDErr          error
	FindByUserAndStoreResult *entity.Favorite
	FindByUserAndStoreErr    error
	CreateErr                error
	DeleteErr                error

	// Call tracking
	FindByUserIDCalled           bool
	FindByUserIDCalledWith       string
	FindByUserAndStoreCalled     bool
	FindByUserAndStoreCalledWith struct{ UserID, StoreID string }
	CreateCalled                 bool
	CreateCalledWith             *entity.Favorite
	DeleteCalled                 bool
	DeleteCalledWith             struct{ UserID, StoreID string }
}

func (m *MockFavoriteRepository) FindByUserID(ctx context.Context, userID string) ([]entity.Favorite, error) {
	m.FindByUserIDCalled = true
	m.FindByUserIDCalledWith = userID
	if m.FindByUserIDErr != nil {
		return nil, m.FindByUserIDErr
	}
	return m.FindByUserIDResult, nil
}

func (m *MockFavoriteRepository) FindByUserAndStore(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	m.FindByUserAndStoreCalled = true
	m.FindByUserAndStoreCalledWith.UserID = userID
	m.FindByUserAndStoreCalledWith.StoreID = storeID
	if m.FindByUserAndStoreErr != nil {
		return nil, m.FindByUserAndStoreErr
	}
	return m.FindByUserAndStoreResult, nil
}

func (m *MockFavoriteRepository) Create(ctx context.Context, favorite *entity.Favorite) error {
	m.CreateCalled = true
	m.CreateCalledWith = favorite
	return m.CreateErr
}

func (m *MockFavoriteRepository) Delete(ctx context.Context, userID string, storeID string) error {
	m.DeleteCalled = true
	m.DeleteCalledWith.UserID = userID
	m.DeleteCalledWith.StoreID = storeID
	return m.DeleteErr
}

// MockMenuRepository implements output.MenuRepository for testing.
type MockMenuRepository struct {
	// Return values
	FindByStoreIDResult     []entity.Menu
	FindByStoreIDErr        error
	FindByStoreAndIDsResult []entity.Menu
	FindByStoreAndIDsErr    error
	CreateErr               error

	// Call tracking
	FindByStoreIDCalled         bool
	FindByStoreIDCalledWith     string
	FindByStoreAndIDsCalled     bool
	FindByStoreAndIDsCalledWith struct {
		StoreID string
		MenuIDs []string
	}
	CreateCalled     bool
	CreateCalledWith *entity.Menu
}

func (m *MockMenuRepository) FindByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	m.FindByStoreIDCalled = true
	m.FindByStoreIDCalledWith = storeID
	if m.FindByStoreIDErr != nil {
		return nil, m.FindByStoreIDErr
	}
	return m.FindByStoreIDResult, nil
}

func (m *MockMenuRepository) FindByStoreAndIDs(ctx context.Context, storeID string, menuIDs []string) ([]entity.Menu, error) {
	m.FindByStoreAndIDsCalled = true
	m.FindByStoreAndIDsCalledWith.StoreID = storeID
	m.FindByStoreAndIDsCalledWith.MenuIDs = menuIDs
	if m.FindByStoreAndIDsErr != nil {
		return nil, m.FindByStoreAndIDsErr
	}
	return m.FindByStoreAndIDsResult, nil
}

func (m *MockMenuRepository) Create(ctx context.Context, menu *entity.Menu) error {
	m.CreateCalled = true
	m.CreateCalledWith = menu
	return m.CreateErr
}

// MockFileRepository implements output.FileRepository for testing.
type MockFileRepository struct {
	// Return values
	FindByStoreAndIDsResult []entity.File
	FindByStoreAndIDsErr    error
	CreateErr               error
	LinkToStoreErr          error

	// Call tracking
	FindByStoreAndIDsCalled     bool
	FindByStoreAndIDsCalledWith struct {
		StoreID string
		FileIDs []string
	}
	CreateCalled          bool
	CreateCalledWith      *entity.File
	LinkToStoreCalled     bool
	LinkToStoreCalledWith struct {
		StoreID string
		FileID  string
	}
}

func (m *MockFileRepository) FindByStoreAndIDs(ctx context.Context, storeID string, fileIDs []string) ([]entity.File, error) {
	m.FindByStoreAndIDsCalled = true
	m.FindByStoreAndIDsCalledWith.StoreID = storeID
	m.FindByStoreAndIDsCalledWith.FileIDs = fileIDs
	if m.FindByStoreAndIDsErr != nil {
		return nil, m.FindByStoreAndIDsErr
	}
	return m.FindByStoreAndIDsResult, nil
}

func (m *MockFileRepository) Create(ctx context.Context, file *entity.File) error {
	m.CreateCalled = true
	m.CreateCalledWith = file
	if m.CreateErr != nil {
		return m.CreateErr
	}
	if file.FileID == "" {
		file.FileID = "generated-file-id"
	}
	return nil
}

func (m *MockFileRepository) LinkToStore(ctx context.Context, storeID string, fileID string) error {
	m.LinkToStoreCalled = true
	m.LinkToStoreCalledWith.StoreID = storeID
	m.LinkToStoreCalledWith.FileID = fileID
	return m.LinkToStoreErr
}

// MockReportRepository implements output.ReportRepository for testing.
type MockReportRepository struct {
	// Return values
	FindAllResult   []entity.Report
	FindAllErr      error
	FindByIDResult  *entity.Report
	FindByIDErr     error
	CreateErr       error
	UpdateStatusErr error

	// Call tracking
	FindAllCalled          bool
	FindByIDCalled         bool
	FindByIDCalledWith     int64
	CreateCalled           bool
	CreateCalledWith       *entity.Report
	UpdateStatusCalled     bool
	UpdateStatusCalledWith struct {
		ReportID int64
		Status   string
	}
}

func (m *MockReportRepository) FindAll(ctx context.Context) ([]entity.Report, error) {
	m.FindAllCalled = true
	if m.FindAllErr != nil {
		return nil, m.FindAllErr
	}
	return m.FindAllResult, nil
}

func (m *MockReportRepository) FindByID(ctx context.Context, reportID int64) (*entity.Report, error) {
	m.FindByIDCalled = true
	m.FindByIDCalledWith = reportID
	if m.FindByIDErr != nil {
		return nil, m.FindByIDErr
	}
	return m.FindByIDResult, nil
}

func (m *MockReportRepository) Create(ctx context.Context, report *entity.Report) error {
	m.CreateCalled = true
	m.CreateCalledWith = report
	return m.CreateErr
}

func (m *MockReportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	m.UpdateStatusCalled = true
	m.UpdateStatusCalledWith.ReportID = reportID
	m.UpdateStatusCalledWith.Status = status
	return m.UpdateStatusErr
}

// MockAuthProvider implements output.AuthProvider for testing.
type MockAuthProvider struct {
	// Return values
	SignupResult *output.AuthUser
	SignupErr    error
	LoginResult  *output.AuthSession
	LoginErr     error

	// Call tracking
	SignupCalled     bool
	SignupCalledWith output.AuthSignupInput
	LoginCalled      bool
	LoginCalledWith  output.AuthLoginInput
}

func (m *MockAuthProvider) Signup(ctx context.Context, in output.AuthSignupInput) (*output.AuthUser, error) {
	m.SignupCalled = true
	m.SignupCalledWith = in
	if m.SignupErr != nil {
		return nil, m.SignupErr
	}
	return m.SignupResult, nil
}

func (m *MockAuthProvider) Login(ctx context.Context, in output.AuthLoginInput) (*output.AuthSession, error) {
	m.LoginCalled = true
	m.LoginCalledWith = in
	if m.LoginErr != nil {
		return nil, m.LoginErr
	}
	return m.LoginResult, nil
}

// MockTransaction implements output.Transaction for testing.
type MockTransaction struct {
	StartErr error

	// Call tracking
	StartTransactionCalled bool
}

func (m *MockTransaction) StartTransaction(fn func(interface{}) error) error {
	m.StartTransactionCalled = true
	if m.StartErr != nil {
		return m.StartErr
	}
	return fn(nil)
}

// ============================================================================
// Handler UseCase Mocks
// ============================================================================

// MockStoreUseCase implements input.StoreUseCase for testing handlers.
type MockStoreUseCase struct {
	// Return values
	Stores       []entity.Store
	Store        *entity.Store
	GetAllErr    error
	GetByIDErr   error
	CreateErr    error
	UpdateErr    error
	DeleteErr    error
	CreatedStore *entity.Store

	// Call tracking
	GetAllStoresCalled     bool
	GetStoreByIDCalled     bool
	GetStoreByIDCalledWith string
	CreateStoreCalled      bool
	CreateStoreCalledWith  input.CreateStoreInput
	UpdateStoreCalled      bool
	UpdateStoreCalledWith  struct {
		ID    string
		Input input.UpdateStoreInput
	}
	DeleteStoreCalled     bool
	DeleteStoreCalledWith string
}

func (m *MockStoreUseCase) GetAllStores(ctx context.Context) ([]entity.Store, error) {
	m.GetAllStoresCalled = true
	if m.GetAllErr != nil {
		return nil, m.GetAllErr
	}
	return m.Stores, nil
}

func (m *MockStoreUseCase) GetStoreByID(ctx context.Context, id string) (*entity.Store, error) {
	m.GetStoreByIDCalled = true
	m.GetStoreByIDCalledWith = id
	if m.GetByIDErr != nil {
		return nil, m.GetByIDErr
	}
	return m.Store, nil
}

func (m *MockStoreUseCase) CreateStore(ctx context.Context, in input.CreateStoreInput) (*entity.Store, error) {
	m.CreateStoreCalled = true
	m.CreateStoreCalledWith = in
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	if m.CreatedStore != nil {
		return m.CreatedStore, nil
	}
	return &entity.Store{
		StoreID: "new-store-id",
		Name:    in.Name,
		Address: in.Address,
	}, nil
}

func (m *MockStoreUseCase) UpdateStore(ctx context.Context, id string, in input.UpdateStoreInput) (*entity.Store, error) {
	m.UpdateStoreCalled = true
	m.UpdateStoreCalledWith.ID = id
	m.UpdateStoreCalledWith.Input = in
	if m.UpdateErr != nil {
		return nil, m.UpdateErr
	}
	return m.Store, nil
}

func (m *MockStoreUseCase) DeleteStore(ctx context.Context, id string) error {
	m.DeleteStoreCalled = true
	m.DeleteStoreCalledWith = id
	return m.DeleteErr
}

// ============================================================================
// UseCase Mocks
// ============================================================================

// MockUserUseCase implements input.UserUseCase for testing.
// It provides configurable return values and tracks method calls for assertions.
type MockUserUseCase struct {
	// Return values for each method
	FindByIDResult       entity.User
	FindByIDErr          error
	EnsureUserResult     entity.User
	EnsureUserErr        error
	UpdateUserResult     entity.User
	UpdateUserErr        error
	UpdateUserRoleErr    error
	GetUserReviewsResult []entity.Review
	GetUserReviewsErr    error

	// Call tracking - indicates if each method was called
	FindByIDCalled       bool
	FindByIDCalledWith   string
	EnsureUserCalled     bool
	EnsureUserCalledWith input.EnsureUserInput
	UpdateUserCalled     bool
	UpdateUserCalledWith struct {
		UserID string
		Input  input.UpdateUserInput
	}
	UpdateUserRoleCalled     bool
	UpdateUserRoleCalledWith struct {
		UserID string
		Role   string
	}
	GetUserReviewsCalled     bool
	GetUserReviewsCalledWith string
}

// Reset clears all call tracking state for reuse between test cases
func (m *MockUserUseCase) Reset() {
	m.FindByIDCalled = false
	m.FindByIDCalledWith = ""
	m.EnsureUserCalled = false
	m.EnsureUserCalledWith = input.EnsureUserInput{}
	m.UpdateUserCalled = false
	m.UpdateUserCalledWith.UserID = ""
	m.UpdateUserCalledWith.Input = input.UpdateUserInput{}
	m.UpdateUserRoleCalled = false
	m.UpdateUserRoleCalledWith.UserID = ""
	m.UpdateUserRoleCalledWith.Role = ""
	m.GetUserReviewsCalled = false
	m.GetUserReviewsCalledWith = ""
}

func (m *MockUserUseCase) FindByID(ctx context.Context, userID string) (entity.User, error) {
	m.FindByIDCalled = true
	m.FindByIDCalledWith = userID
	if m.FindByIDErr != nil {
		return entity.User{}, m.FindByIDErr
	}
	return m.FindByIDResult, nil
}

func (m *MockUserUseCase) EnsureUser(ctx context.Context, in input.EnsureUserInput) (entity.User, error) {
	m.EnsureUserCalled = true
	m.EnsureUserCalledWith = in
	if m.EnsureUserErr != nil {
		return entity.User{}, m.EnsureUserErr
	}
	return m.EnsureUserResult, nil
}

func (m *MockUserUseCase) UpdateUser(ctx context.Context, userID string, in input.UpdateUserInput) (entity.User, error) {
	m.UpdateUserCalled = true
	m.UpdateUserCalledWith.UserID = userID
	m.UpdateUserCalledWith.Input = in
	if m.UpdateUserErr != nil {
		return entity.User{}, m.UpdateUserErr
	}
	return m.UpdateUserResult, nil
}

func (m *MockUserUseCase) UpdateUserRole(ctx context.Context, userID string, role string) error {
	m.UpdateUserRoleCalled = true
	m.UpdateUserRoleCalledWith.UserID = userID
	m.UpdateUserRoleCalledWith.Role = role
	return m.UpdateUserRoleErr
}

func (m *MockUserUseCase) GetUserReviews(ctx context.Context, userID string) ([]entity.Review, error) {
	m.GetUserReviewsCalled = true
	m.GetUserReviewsCalledWith = userID
	if m.GetUserReviewsErr != nil {
		return nil, m.GetUserReviewsErr
	}
	return m.GetUserReviewsResult, nil
}

// MockTokenVerifier implements security.TokenVerifier for testing
type MockTokenVerifier struct {
	Claims *security.TokenClaims
	Err    error
	// Call tracking
	VerifyCalled     bool
	VerifyCalledWith string
}

func (m *MockTokenVerifier) Verify(ctx context.Context, token string) (*security.TokenClaims, error) {
	m.VerifyCalled = true
	m.VerifyCalledWith = token
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

	// Call tracking
	SignupCalled     bool
	SignupCalledWith input.AuthSignupInput
	LoginCalled      bool
	LoginCalledWith  input.AuthLoginInput
}

func (m *MockAuthUseCase) Signup(ctx context.Context, in input.AuthSignupInput) (*entity.User, error) {
	m.SignupCalled = true
	m.SignupCalledWith = in
	if m.SignupErr != nil {
		return nil, m.SignupErr
	}
	return m.SignupResult, nil
}

func (m *MockAuthUseCase) Login(ctx context.Context, in input.AuthLoginInput) (*input.AuthSession, error) {
	m.LoginCalled = true
	m.LoginCalledWith = in
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

	// Call tracking
	CreateCalled     bool
	CreateCalledWith input.CreateReportInput
	GetAllCalled     bool
	HandleCalled     bool
	HandleCalledWith struct {
		ReportID int64
		Action   input.HandleReportAction
	}
}

func (m *MockReportUseCase) CreateReport(ctx context.Context, in input.CreateReportInput) (*entity.Report, error) {
	m.CreateCalled = true
	m.CreateCalledWith = in
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}

func (m *MockReportUseCase) GetAllReports(ctx context.Context) ([]entity.Report, error) {
	m.GetAllCalled = true
	if m.GetAllErr != nil {
		return nil, m.GetAllErr
	}
	return m.GetAllResult, nil
}

func (m *MockReportUseCase) HandleReport(ctx context.Context, reportID int64, action input.HandleReportAction) error {
	m.HandleCalled = true
	m.HandleCalledWith.ReportID = reportID
	m.HandleCalledWith.Action = action
	return m.HandleReportErr
}

// MockAdminUseCase implements input.AdminUseCase for testing
type MockAdminUseCase struct {
	GetPendingResult []entity.Store
	GetPendingErr    error
	ApproveErr       error
	RejectErr        error

	// Call tracking
	GetPendingCalled  bool
	ApproveCalled     bool
	ApproveCalledWith string
	RejectCalled      bool
	RejectCalledWith  string
}

func (m *MockAdminUseCase) GetPendingStores(ctx context.Context) ([]entity.Store, error) {
	m.GetPendingCalled = true
	if m.GetPendingErr != nil {
		return nil, m.GetPendingErr
	}
	return m.GetPendingResult, nil
}

func (m *MockAdminUseCase) ApproveStore(ctx context.Context, storeID string) error {
	m.ApproveCalled = true
	m.ApproveCalledWith = storeID
	return m.ApproveErr
}

func (m *MockAdminUseCase) RejectStore(ctx context.Context, storeID string) error {
	m.RejectCalled = true
	m.RejectCalledWith = storeID
	return m.RejectErr
}

// MockReviewUseCase implements input.ReviewUseCase for testing
type MockReviewUseCase struct {
	GetByStoreIDResult []entity.Review
	GetByStoreIDErr    error
	CreateErr          error
	LikeErr            error
	UnlikeErr          error

	// Call tracking
	GetByStoreIDCalled     bool
	GetByStoreIDCalledWith struct {
		StoreID  string
		Sort     string
		ViewerID string
	}
	CreateCalled     bool
	CreateCalledWith struct {
		StoreID string
		UserID  string
		Input   input.CreateReview
	}
	LikeCalled       bool
	LikeCalledWith   struct{ ReviewID, UserID string }
	UnlikeCalled     bool
	UnlikeCalledWith struct{ ReviewID, UserID string }
}

func (m *MockReviewUseCase) GetReviewsByStoreID(ctx context.Context, storeID string, sort string, viewerID string) ([]entity.Review, error) {
	m.GetByStoreIDCalled = true
	m.GetByStoreIDCalledWith.StoreID = storeID
	m.GetByStoreIDCalledWith.Sort = sort
	m.GetByStoreIDCalledWith.ViewerID = viewerID
	if m.GetByStoreIDErr != nil {
		return nil, m.GetByStoreIDErr
	}
	return m.GetByStoreIDResult, nil
}

func (m *MockReviewUseCase) Create(ctx context.Context, storeID string, userID string, in input.CreateReview) error {
	m.CreateCalled = true
	m.CreateCalledWith.StoreID = storeID
	m.CreateCalledWith.UserID = userID
	m.CreateCalledWith.Input = in
	return m.CreateErr
}

func (m *MockReviewUseCase) LikeReview(ctx context.Context, reviewID string, userID string) error {
	m.LikeCalled = true
	m.LikeCalledWith.ReviewID = reviewID
	m.LikeCalledWith.UserID = userID
	return m.LikeErr
}

func (m *MockReviewUseCase) UnlikeReview(ctx context.Context, reviewID string, userID string) error {
	m.UnlikeCalled = true
	m.UnlikeCalledWith.ReviewID = reviewID
	m.UnlikeCalledWith.UserID = userID
	return m.UnlikeErr
}

// MockFavoriteUseCase implements input.FavoriteUseCase for testing
type MockFavoriteUseCase struct {
	GetMyFavoritesResult []entity.Favorite
	GetMyFavoritesErr    error
	AddResult            *entity.Favorite
	AddErr               error
	RemoveErr            error

	// Call tracking
	GetMyFavoritesCalled     bool
	GetMyFavoritesCalledWith string
	AddCalled                bool
	AddCalledWith            struct{ UserID, StoreID string }
	RemoveCalled             bool
	RemoveCalledWith         struct{ UserID, StoreID string }
}

func (m *MockFavoriteUseCase) GetMyFavorites(ctx context.Context, userID string) ([]entity.Favorite, error) {
	m.GetMyFavoritesCalled = true
	m.GetMyFavoritesCalledWith = userID
	if m.GetMyFavoritesErr != nil {
		return nil, m.GetMyFavoritesErr
	}
	return m.GetMyFavoritesResult, nil
}

func (m *MockFavoriteUseCase) AddFavorite(ctx context.Context, userID string, storeID string) (*entity.Favorite, error) {
	m.AddCalled = true
	m.AddCalledWith.UserID = userID
	m.AddCalledWith.StoreID = storeID
	if m.AddErr != nil {
		return nil, m.AddErr
	}
	return m.AddResult, nil
}

func (m *MockFavoriteUseCase) RemoveFavorite(ctx context.Context, userID string, storeID string) error {
	m.RemoveCalled = true
	m.RemoveCalledWith.UserID = userID
	m.RemoveCalledWith.StoreID = storeID
	return m.RemoveErr
}

// MockMenuUseCase implements input.MenuUseCase for testing
type MockMenuUseCase struct {
	GetByStoreIDResult []entity.Menu
	GetByStoreIDErr    error
	CreateResult       *entity.Menu
	CreateErr          error

	// Call tracking
	GetByStoreIDCalled     bool
	GetByStoreIDCalledWith string
	CreateCalled           bool
	CreateCalledWith       struct {
		StoreID string
		Input   input.CreateMenuInput
	}
}

func (m *MockMenuUseCase) GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	m.GetByStoreIDCalled = true
	m.GetByStoreIDCalledWith = storeID
	if m.GetByStoreIDErr != nil {
		return nil, m.GetByStoreIDErr
	}
	return m.GetByStoreIDResult, nil
}

func (m *MockMenuUseCase) CreateMenu(ctx context.Context, storeID string, in input.CreateMenuInput) (*entity.Menu, error) {
	m.CreateCalled = true
	m.CreateCalledWith.StoreID = storeID
	m.CreateCalledWith.Input = in
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}

// MockMediaUseCase implements input.MediaUseCase for testing
type MockMediaUseCase struct {
	CreateResult []input.SignedUploadFile
	CreateErr    error

	// Call tracking
	CreateReviewUploadsCalled     bool
	CreateReviewUploadsCalledWith struct {
		StoreID string
		UserID  string
		Files   []input.UploadFileInput
	}
}

func (m *MockMediaUseCase) CreateReviewUploads(ctx context.Context, storeID string, userID string, files []input.UploadFileInput) ([]input.SignedUploadFile, error) {
	m.CreateReviewUploadsCalled = true
	m.CreateReviewUploadsCalledWith.StoreID = storeID
	m.CreateReviewUploadsCalledWith.UserID = userID
	m.CreateReviewUploadsCalledWith.Files = files
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	return m.CreateResult, nil
}

// MockStorageProvider implements output.StorageProvider for testing.
// It provides configurable return values with sensible defaults when not configured.
type MockStorageProvider struct {
	CreateSignedUploadResult   *output.SignedUpload
	CreateSignedUploadErr      error
	CreateSignedDownloadResult *output.SignedDownload
	CreateSignedDownloadErr    error

	// SignedURLsByKey maps object keys to their signed URLs (for per-key behavior)
	SignedURLsByKey map[string]string
	// ErrorsByKey maps object keys to errors that should be returned for those keys
	ErrorsByKey map[string]error
	// ReturnNil when true, returns nil result without error
	ReturnNil bool
	// ReturnEmptyURL when true, returns a result with an empty URL string
	ReturnEmptyURL bool
	// RequestedKeys tracks which keys were requested (for verification in tests)
	RequestedKeys []string
}

// CreateSignedUpload returns a configured result or a sensible default.
// Default: returns a valid signed upload with the provided parameters.
func (m *MockStorageProvider) CreateSignedUpload(ctx context.Context, bucket, objectPath, contentType string, expiresIn time.Duration, upsert bool) (*output.SignedUpload, error) {
	if m.CreateSignedUploadErr != nil {
		return nil, m.CreateSignedUploadErr
	}
	if m.CreateSignedUploadResult != nil {
		return m.CreateSignedUploadResult, nil
	}
	// Default: return a valid signed upload based on the input parameters
	return &output.SignedUpload{
		Bucket:      bucket,
		Path:        objectPath,
		Token:       "mock-upload-token-" + objectPath,
		ExpiresIn:   expiresIn,
		ContentType: contentType,
		Upsert:      upsert,
	}, nil
}

// CreateSignedDownload returns a configured result or a sensible default.
// Default: returns a valid signed URL based on the object path.
func (m *MockStorageProvider) CreateSignedDownload(ctx context.Context, bucket, objectPath string, expiresIn time.Duration) (*output.SignedDownload, error) {
	// Track requested keys for test verification
	m.RequestedKeys = append(m.RequestedKeys, objectPath)

	// Check for key-specific error
	if m.ErrorsByKey != nil {
		if err, ok := m.ErrorsByKey[objectPath]; ok {
			return nil, err
		}
	}

	// Check global error
	if m.CreateSignedDownloadErr != nil {
		return nil, m.CreateSignedDownloadErr
	}

	// Return nil result if configured
	if m.ReturnNil {
		return nil, nil
	}

	// Return empty URL if configured
	if m.ReturnEmptyURL {
		return &output.SignedDownload{URL: ""}, nil
	}

	// Check for key-specific signed URL
	if m.SignedURLsByKey != nil {
		if url, ok := m.SignedURLsByKey[objectPath]; ok {
			return &output.SignedDownload{URL: url}, nil
		}
	}

	// Check global result
	if m.CreateSignedDownloadResult != nil {
		return m.CreateSignedDownloadResult, nil
	}

	// Default: return a valid signed download URL
	return &output.SignedDownload{
		Bucket:    bucket,
		Path:      objectPath,
		URL:       "https://storage.example.com/signed/" + bucket + "/" + objectPath,
		ExpiresIn: expiresIn,
	}, nil
}
