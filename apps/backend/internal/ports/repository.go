package ports

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
)

// StoreRepository abstracts store persistence boundary.
type StoreRepository interface {
	FindAll(ctx context.Context) ([]domain.Store, error)
	FindByID(ctx context.Context, id int64) (*domain.Store, error)
	FindPending(ctx context.Context) ([]domain.Store, error)
	Create(ctx context.Context, store *domain.Store) error
	Update(ctx context.Context, store *domain.Store) error
	Delete(ctx context.Context, id int64) error
}

// MenuRepository abstracts menu persistence boundary.
type MenuRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	Create(ctx context.Context, menu *domain.Menu) error
}

// ReviewRepository abstracts review persistence boundary.
type ReviewRepository interface {
	FindByStoreID(ctx context.Context, storeID int64) ([]domain.Review, error)
	FindByUserID(ctx context.Context, userID string) ([]domain.Review, error)
	Create(ctx context.Context, review *domain.Review) error
}

// UserRepository abstracts user persistence boundary.
type UserRepository interface {
	FindByID(ctx context.Context, userID string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Create(ctx context.Context, user *domain.User) error
	Update(ctx context.Context, user *domain.User) error
	UpdateRole(ctx context.Context, userID string, role string) error
}

// FavoriteRepository abstracts favorite persistence boundary.
type FavoriteRepository interface {
	FindByUserID(ctx context.Context, userID string) ([]domain.Favorite, error)
	FindByUserAndStore(ctx context.Context, userID string, storeID int64) (*domain.Favorite, error)
	Create(ctx context.Context, favorite *domain.Favorite) error
	Delete(ctx context.Context, userID string, storeID int64) error
}

// ReportRepository abstracts report persistence boundary.
type ReportRepository interface {
	FindAll(ctx context.Context) ([]domain.Report, error)
	FindByID(ctx context.Context, reportID int64) (*domain.Report, error)
	Create(ctx context.Context, report *domain.Report) error
	UpdateStatus(ctx context.Context, reportID int64, status string) error
}

// MediaRepository abstracts media persistence boundary.
type MediaRepository interface {
	FindByID(ctx context.Context, mediaID int64) (*domain.Media, error)
	Create(ctx context.Context, media *domain.Media) error
}
