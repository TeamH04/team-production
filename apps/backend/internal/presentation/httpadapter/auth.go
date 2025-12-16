package httpadapter

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

type AuthHandler struct {
	controller handlers.AuthController
}

func NewAuthHandler(controller handlers.AuthController) *AuthHandler {
	return &AuthHandler{controller: controller}
}

type signupDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

func (dto signupDTO) toCommand() handlers.SignupCommand {
	return handlers.SignupCommand{
		Email:    dto.Email,
		Password: dto.Password,
		Name:     dto.Name,
	}
}

func (h *AuthHandler) Signup(c echo.Context) error {
	var dto signupDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}

	user, err := h.controller.Signup(c.Request().Context(), dto.toCommand())
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusCreated, resp)
}

type loginDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (dto loginDTO) toCommand() handlers.LoginCommand {
	return handlers.LoginCommand{
		Email:    dto.Email,
		Password: dto.Password,
	}
}

func (h *AuthHandler) Login(c echo.Context) error {
	var dto loginDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	session, err := h.controller.Login(c.Request().Context(), dto.toCommand())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presenter.NewAuthSessionResponse(session))
}

func (h *AuthHandler) GetMe(c echo.Context) error {
	userID := requestcontext.UserID(c)
	user, err := h.controller.GetMe(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	resp := presenter.NewUserResponse(*user)
	return c.JSON(http.StatusOK, resp)
}

type updateRoleDTO struct {
	Role string `json:"role"`
}

func (dto updateRoleDTO) toCommand() handlers.UpdateRoleCommand {
	return handlers.UpdateRoleCommand{Role: dto.Role}
}

func (h *AuthHandler) UpdateRole(c echo.Context) error {
	var dto updateRoleDTO
	if err := c.Bind(&dto); err != nil {
		return presentation.NewBadRequest("invalid JSON")
	}
	userID := requestcontext.UserID(c)
	if err := h.controller.UpdateRole(c.Request().Context(), userID, dto.toCommand()); err != nil {
		return err
	}
	return c.JSON(http.StatusOK, presentation.NewMessageResponse("role updated successfully"))
}
