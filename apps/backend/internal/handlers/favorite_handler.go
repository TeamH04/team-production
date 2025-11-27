package handlers

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type FavoriteHandler struct {
	favoriteUseCase usecase.FavoriteUseCase
}

var _ FavoriteController = (*FavoriteHandler)(nil)

type AddFavoriteCommand struct {
	StoreID int64
}

func NewFavoriteHandler(favoriteUseCase usecase.FavoriteUseCase) *FavoriteHandler {
	return &FavoriteHandler{
		favoriteUseCase: favoriteUseCase,
	}
}

func (h *FavoriteHandler) GetUserFavorites(ctx context.Context, userID string) ([]domain.Favorite, error) {
	return h.favoriteUseCase.GetUserFavorites(ctx, userID)
}

func (h *FavoriteHandler) AddFavorite(ctx context.Context, userID, requesterID string, cmd AddFavoriteCommand) (*domain.Favorite, error) {
	if userID != requesterID {
		return nil, usecase.ErrForbidden
	}

	return h.favoriteUseCase.AddFavorite(ctx, userID, cmd.StoreID)
}

func (h *FavoriteHandler) RemoveFavorite(ctx context.Context, userID, requesterID string, storeID int64) error {
	if userID != requesterID {
		return usecase.ErrForbidden
	}
	return h.favoriteUseCase.RemoveFavorite(ctx, userID, storeID)
}
