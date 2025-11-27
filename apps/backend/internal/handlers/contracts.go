package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// StoreController exposes store operations to driving adapters.
type StoreController interface {
	GetStores(ctx context.Context) ([]domain.Store, error)
	GetStoreByID(ctx context.Context, id int64) (*domain.Store, error)
	CreateStore(ctx context.Context, cmd CreateStoreCommand) (*domain.Store, error)
	UpdateStore(ctx context.Context, id int64, cmd UpdateStoreCommand) (*domain.Store, error)
	DeleteStore(ctx context.Context, id int64) error
}

// MenuController exposes menu operations.
type MenuController interface {
	GetMenusByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	CreateMenu(ctx context.Context, storeID int64, cmd CreateMenuCommand) (*domain.Menu, error)
}

// ReviewController exposes review operations.
type ReviewController interface {
	GetReviewsByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	CreateReview(ctx context.Context, storeID int64, userID string, cmd CreateReviewCommand) (*domain.Review, error)
}

// UserController exposes user operations.
type UserController interface {
	GetMe(ctx context.Context, userID string) (*domain.User, error)
	UpdateUser(ctx context.Context, userID, requesterID string, cmd UpdateUserCommand) (*domain.User, error)
	GetUserReviews(ctx context.Context, userID string) ([]domain.Review, error)
}

// FavoriteController exposes favorite operations.
type FavoriteController interface {
	GetUserFavorites(ctx context.Context, userID string) ([]domain.Favorite, error)
	AddFavorite(ctx context.Context, userID, requesterID string, cmd AddFavoriteCommand) (*domain.Favorite, error)
	RemoveFavorite(ctx context.Context, userID, requesterID string, storeID int64) error
}

// ReportController exposes report operations.
type ReportController interface {
	CreateReport(ctx context.Context, userID string, cmd CreateReportCommand) (*domain.Report, error)
}

// AdminController exposes administrative operations.
type AdminController interface {
	GetPendingStores(ctx context.Context) ([]domain.Store, error)
	ApproveStore(ctx context.Context, storeID int64) error
	RejectStore(ctx context.Context, storeID int64) error
	GetReports(ctx context.Context) ([]domain.Report, error)
	HandleReport(ctx context.Context, reportID int64, cmd HandleReportCommand) error
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)
}

// MediaController exposes media operations.
type MediaController interface {
	GetMedia(ctx context.Context, mediaID int64) (*domain.Media, error)
	UploadMedia(ctx context.Context, userID string, cmd UploadMediaCommand) (*usecase.SignedUploadURL, error)
}

// AuthController exposes auth/user-profile operations.
type AuthController interface {
	GetMe(ctx context.Context, userID string) (*domain.User, error)
	UpdateRole(ctx context.Context, userID string, cmd UpdateRoleCommand) error
	Signup(ctx context.Context, cmd SignupCommand) (*domain.User, error)
	Login(ctx context.Context, cmd LoginCommand) (*usecase.AuthSession, error)
}
