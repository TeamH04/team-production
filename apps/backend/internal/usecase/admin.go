package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// AdminUseCase は管理者機能に関するビジネスロジックを提供します
type AdminUseCase interface {
	GetPendingStores(ctx context.Context) ([]entity.Store, error)
	ApproveStore(ctx context.Context, storeID string) error
	RejectStore(ctx context.Context, storeID string) error
}

type adminUseCase struct {
	storeRepo output.StoreRepository
}

// NewAdminUseCase は AdminUseCase の実装を生成します
func NewAdminUseCase(storeRepo output.StoreRepository) AdminUseCase {
	return &adminUseCase{
		storeRepo: storeRepo,
	}
}

func (uc *adminUseCase) GetPendingStores(ctx context.Context) ([]entity.Store, error) {
	return uc.storeRepo.FindPending(ctx)
}

func (uc *adminUseCase) ApproveStore(ctx context.Context, storeID string) error {
	store, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	store.IsApproved = true
	return uc.storeRepo.Update(ctx, store)
}

func (uc *adminUseCase) RejectStore(ctx context.Context, storeID string) error {
	store, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	store.IsApproved = false
	return uc.storeRepo.Update(ctx, store)
}
