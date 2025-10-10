package interactor

import (
	"strings"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/port"
)

type authInteractor struct {
	users port.UserRepository
}

func NewAuthInteractor(users port.UserRepository) port.AuthUsecase {
	return &authInteractor{users: users}
}

func (i *authInteractor) SignUp(in port.SignUpInput) (domain.User, error) {
	// normalize role
	role := strings.ToLower(in.Role)
	if role != "owner" {
		role = "user"
	}

	if u, ok, err := i.users.FindByID(in.UserID); err != nil {
		return domain.User{}, err
	} else if ok {
		return u, nil
	}

	u := domain.User{
		UserID:    in.UserID,
		Name:      in.Name,
		Email:     in.Email,
		IconURL:   in.Picture,
		Role:      role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	return i.users.Create(u)
}
