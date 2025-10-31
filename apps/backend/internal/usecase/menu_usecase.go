package usecase

import (
	"context"
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"gorm.io/gorm"
)

// MenuUseCase はメニューに関するビジネスロジックを提供します
type MenuUseCase interface {
	GetMenusByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error)
	CreateMenu(ctx context.Context, storeID int64, input CreateMenuInput) (*domain.Menu, error)
}

type CreateMenuInput struct {
	Name        string
	Price       *int
	ImageURL    *string
	Description *string
}

type menuUseCase struct {
	menuRepo  repository.MenuRepository
	storeRepo repository.StoreRepository
}

// NewMenuUseCase は MenuUseCase の実装を生成します
func NewMenuUseCase(menuRepo repository.MenuRepository, storeRepo repository.StoreRepository) MenuUseCase {
	return &menuUseCase{
		menuRepo:  menuRepo,
		storeRepo: storeRepo,
	}
}

func (uc *menuUseCase) GetMenusByStoreID(ctx context.Context, storeID int64) ([]domain.Menu, error) {
	// ストアの存在確認
	_, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	return uc.menuRepo.FindByStoreID(ctx, storeID)
}

func (uc *menuUseCase) CreateMenu(ctx context.Context, storeID int64, input CreateMenuInput) (*domain.Menu, error) {
	// ストアの存在確認
	_, err := uc.storeRepo.FindByID(ctx, storeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoreNotFound
		}
		return nil, err
	}

	// バリデーション
	if input.Name == "" {
		return nil, ErrInvalidInput
	}

	menu := &domain.Menu{
		StoreID:     storeID,
		Name:        input.Name,
		Price:       input.Price,
		ImageURL:    input.ImageURL,
		Description: input.Description,
	}

	if err := uc.menuRepo.Create(ctx, menu); err != nil {
		return nil, err
	}

	return menu, nil
}
