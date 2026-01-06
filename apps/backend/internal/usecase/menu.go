package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// MenuUseCase はメニューに関するビジネスロジックを提供します
type MenuUseCase interface {
	GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error)
	CreateMenu(ctx context.Context, storeID string, input input.CreateMenuInput) (*entity.Menu, error)
}

type menuUseCase struct {
	menuRepo  output.MenuRepository
	storeRepo output.StoreRepository
}

// NewMenuUseCase は MenuUseCase の実装を生成します
func NewMenuUseCase(menuRepo output.MenuRepository, storeRepo output.StoreRepository) MenuUseCase {
	return &menuUseCase{
		menuRepo:  menuRepo,
		storeRepo: storeRepo,
	}
}

func (uc *menuUseCase) GetMenusByStoreID(ctx context.Context, storeID string) ([]entity.Menu, error) {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	return uc.menuRepo.FindByStoreID(ctx, storeID)
}

func (uc *menuUseCase) CreateMenu(ctx context.Context, storeID string, in input.CreateMenuInput) (*entity.Menu, error) {
	// ストアの存在確認
	if _, err := uc.storeRepo.FindByID(ctx, storeID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// バリデーション
	if in.Name == "" {
		return nil, ErrInvalidInput
	}

	menu := &entity.Menu{
		StoreID:     storeID,
		Name:        in.Name,
		Price:       in.Price,
		Description: in.Description,
	}

	if err := uc.menuRepo.Create(ctx, menu); err != nil {
		return nil, err
	}

	return menu, nil
}
