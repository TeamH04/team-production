package interactor

import (
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
)

var ErrNotFound = errors.New("not found")

type reviewCmd struct {
	reviews port.ReviewRepository
	stores  port.StoreRepository
	users   port.UserRepository
}

func NewReviewCommandInteractor(r port.ReviewRepository, s port.StoreRepository, u port.UserRepository) port.ReviewCommandUsecase {
	return &reviewCmd{reviews: r, stores: s, users: u}
}

func (i *reviewCmd) PostReview(r domain.Review) (domain.Review, error) {
	if _, ok, err := i.stores.GetByID(r.StoreID); err != nil {
		return domain.Review{}, err
	} else if !ok {
		return domain.Review{}, ErrNotFound
	}
	if _, ok, err := i.users.FindByID(r.UserID); err != nil {
		return domain.Review{}, err
	} else if !ok {
		return domain.Review{}, ErrNotFound
	}
	return i.reviews.Create(r)
}
