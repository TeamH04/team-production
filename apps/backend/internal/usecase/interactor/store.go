package interactor

import (
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
)

type storeQuery struct{ repo port.StoreRepository }
type storeCmd struct{ repo port.StoreRepository }

func NewStoreQueryInteractor(r port.StoreRepository) port.StoreQueryUsecase {
	return &storeQuery{repo: r}
}
func NewStoreCommandInteractor(r port.StoreRepository) port.StoreCommandUsecase {
	return &storeCmd{repo: r}
}

func (i *storeQuery) ListStores() ([]domain.Store, error) { return i.repo.List() }
func (i *storeQuery) GetStoreByID(id int64) (domain.Store, error) {
	s, ok, err := i.repo.GetByID(id)
	if err != nil {
		return domain.Store{}, err
	}
	if !ok {
		return domain.Store{}, ErrNotFound
	}
	return s, nil
}

func (i *storeCmd) CreateStore(s domain.Store) (domain.Store, error) { return i.repo.Create(s) }
