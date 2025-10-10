package port

import "github.com/TeamH04/team-production/apps/backend/internal/domain"

// Auth use cases
type AuthUsecase interface {
	SignUp(input SignUpInput) (domain.User, error)
}

type SignUpInput struct {
	UserID  string
	Email   string
	Name    string
	Picture string
	Role    string // "user" or "owner"
}

// Store query and commands
type StoreQueryUsecase interface {
	ListStores() ([]domain.Store, error)
	GetStoreByID(id int64) (domain.Store, error)
}

type StoreCommandUsecase interface {
	CreateStore(s domain.Store) (domain.Store, error)
}

// Review command
type ReviewCommandUsecase interface {
	PostReview(r domain.Review) (domain.Review, error)
}
