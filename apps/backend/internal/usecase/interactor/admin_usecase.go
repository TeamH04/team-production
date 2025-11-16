package interactor

import (
	"context"
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"gorm.io/gorm"
)

// AdminUseCase は管理者機能に関するビジネスロジックを提供します
type AdminUseCase interface {
	GetPendingStores(ctx context.Context) ([]domain.Store, error)
	ApproveStore(ctx context.Context, storeID int64) error
	RejectStore(ctx context.Context, storeID int64) error
}

type adminUseCase struct {
	storeRepo repository.StoreRepository
}

// NewAdminUseCase は AdminUseCase の実装を生成します
func NewAdminUseCase(storeRepo repository.StoreRepository) AdminUseCase {
	return &adminUseCase{
		storeRepo: storeRepo,
	}
}

func (uc *adminUseCase) GetPendingStores(ctx context.Context) ([]domain.Store, error) {
	// 承認待ちの店舗を取得（新しいメソッドが必要）
	// 仮の実装として全店舗を返す
	return uc.storeRepo.FindAll(ctx)
}

func (uc *adminUseCase) ApproveStore(ctx context.Context, storeID int64) error {
	store, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	store.IsApproved = true
	return uc.storeRepo.Update(ctx, store)
}

func (uc *adminUseCase) RejectStore(ctx context.Context, storeID int64) error {
	store, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrStoreNotFound
		}
		return err
	}

	store.IsApproved = false
	return uc.storeRepo.Update(ctx, store)
}
