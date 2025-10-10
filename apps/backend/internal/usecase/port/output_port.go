package port

import "github.com/TeamH04/team-production/apps/backend/internal/domain"

type UserRepository interface {
	FindByID(id string) (domain.User, bool, error)
	Create(u domain.User) (domain.User, error)
}

type StoreRepository interface {
	List() ([]domain.Store, error)
	GetByID(id int64) (domain.Store, bool, error)
	Create(s domain.Store) (domain.Store, error)
}

type ReviewRepository interface {
	Create(r domain.Review) (domain.Review, error)
}
