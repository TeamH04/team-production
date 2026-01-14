package usecase

import (
	"context"

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
	return uc.setStoreApproval(ctx, storeID, true)
}

func (uc *adminUseCase) RejectStore(ctx context.Context, storeID string) error {
	return uc.setStoreApproval(ctx, storeID, false)
}

// setStoreApproval is a helper to set store approval status.
func (uc *adminUseCase) setStoreApproval(ctx context.Context, storeID string, approved bool) error {
	store, err := mustFindStore(ctx, uc.storeRepo, storeID)
	if err != nil {
		return err
	}

	store.IsApproved = approved
	return uc.storeRepo.Update(ctx, store)
}
