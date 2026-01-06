package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type AuthHandler struct {
	authUseCase input.AuthUseCase
	userUseCase input.UserUseCase
}

type SignupCommand struct {
	Email    string
	Password string
	Name     string
}

func (c SignupCommand) toInput() input.AuthSignupInput {
	return input.AuthSignupInput{
		Email:    c.Email,
		Password: c.Password,
		Name:     c.Name,
	}
}

type LoginCommand struct {
	Email    string
	Password string
}

func (c LoginCommand) toInput() input.AuthLoginInput {
	return input.AuthLoginInput{
		Email:    c.Email,
		Password: c.Password,
	}
}

type UpdateRoleCommand struct {
	Role string
}

// NewAuthHandler は AuthHandler を生成します
func NewAuthHandler(authUseCase input.AuthUseCase, userUseCase input.UserUseCase) *AuthHandler {
	return &AuthHandler{
		authUseCase: authUseCase,
		userUseCase: userUseCase,
	}
}

func (h *AuthHandler) GetMe(c echo.Context) error {
	userFromCtx, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	user, err := h.userUseCase.FindByID(c.Request().Context(), userFromCtx.UserID)
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(user)
	return c.JSON(http.StatusOK, resp)
}

func (h *AuthHandler) UpdateRole(c echo.Context) error {
	user, err := requestcontext.GetUserFromContext(c.Request().Context())
	if err != nil {
		return usecase.ErrUnauthorized
	}

	var dto updateRoleDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	if err := h.userUseCase.UpdateUserRole(c.Request().Context(), user.UserID, dto.toCommand().Role); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("role updated successfully"))
}

func (h *AuthHandler) Signup(c echo.Context) error {
	var dto signupDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	user, err := h.authUseCase.Signup(c.Request().Context(), dto.toCommand().toInput())
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusCreated, resp)
}

func (h *AuthHandler) Login(c echo.Context) error {
	var dto loginDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	session, err := h.authUseCase.Login(c.Request().Context(), dto.toCommand().toInput())
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

func (dto signupDTO) toCommand() SignupCommand {
	return SignupCommand{
		Email:    dto.Email,
		Password: dto.Password,
		Name:     dto.Name,
	}
}

type loginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (dto loginDTO) toCommand() LoginCommand {
	return LoginCommand{
		Email:    dto.Email,
		Password: dto.Password,
	}
}

type updateRoleDTO struct {
	Role string `json:"role"`
}

func (dto updateRoleDTO) toCommand() UpdateRoleCommand {
	return UpdateRoleCommand{Role: dto.Role}
}
