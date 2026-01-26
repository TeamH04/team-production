package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AuthHandler struct {
	authUseCase input.AuthUseCase
	userUseCase input.UserUseCase
}

// NewAuthHandler は AuthHandler を生成します
func NewAuthHandler(authUseCase input.AuthUseCase, userUseCase input.UserUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
		userUseCase: userUseCase,
	}
}

// GetMe returns the current authenticated user.
func (h *AuthHandler) GetMe(c echo.Context) error {
	return fetchAndRespondWithCurrentUser(c, h.userUseCase)
}

func (h *AuthHandler) UpdateRole(c echo.Context) error {
	user, err := getRequiredUser(c)
	if err != nil {
		return err
	}

	var dto updateRoleDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}

	if err := h.userUseCase.UpdateUserRole(c.Request().Context(), user.UserID, dto.Role); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("role updated successfully"))
}

func (h *AuthHandler) Signup(c echo.Context) error {
	var dto signupDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}

	user, err := h.authUseCase.Signup(c.Request().Context(), dto.toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusCreated, resp)
}

func (h *AuthHandler) Login(c echo.Context) error {
	var dto loginDTO
	if err := bindJSON(c, &dto); err != nil {
		return err
	}
	session, err := h.authUseCase.Login(c.Request().Context(), dto.toInput())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewAuthSessionResponse(session))
}

type signupDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

func (dto signupDTO) toInput() input.AuthSignupInput {
	return input.AuthSignupInput{
		Email:    dto.Email,
		Password: dto.Password,
		Name:     dto.Name,
		Role:     "",
	}
}

type loginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (dto loginDTO) toInput() input.AuthLoginInput {
	return input.AuthLoginInput{
		Email:    dto.Email,
		Password: dto.Password,
	}
}

type updateRoleDTO struct {
	Role string `json:"role"`
}
