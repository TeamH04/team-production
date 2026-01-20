package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// OwnerHandler handles owner-related flows.
type OwnerHandler struct {
	ownerUseCase input.OwnerUseCase
}

// NewOwnerHandler creates a new OwnerHandler.
func NewOwnerHandler(ownerUseCase input.OwnerUseCase) *OwnerHandler {
	return &OwnerHandler{
		ownerUseCase: ownerUseCase,
	}
}

type ownerSignupCompleteDTO struct {
	ContactName string  `json:"contact_name"`
	StoreName   string  `json:"store_name"`
	OpeningDate string  `json:"opening_date"`
	Phone       *string `json:"phone"`
}

func (h *OwnerHandler) Complete(c echo.Context) error {
	var dto ownerSignupCompleteDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}

	userFromCtx, err := getRequiredUser(c)
	if err != nil {
		return err
	}
	if userFromCtx.Role == role.Owner {
		return usecase.ErrAlreadyOwner
	}

	user, err := h.ownerUseCase.Complete(
		c.Request().Context(),
		userFromCtx,
		input.OwnerSignupCompleteInput{
			ContactName: dto.ContactName,
			StoreName:   dto.StoreName,
			OpeningDate: dto.OpeningDate,
			Phone:       dto.Phone,
		},
	)
	if err != nil {
		return err
	}

	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusCreated, resp)
}
