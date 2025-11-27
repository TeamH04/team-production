package httpadapter

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/presenter"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

type stubAuthController struct {
	loginFn func(ctx context.Context, cmd handlers.LoginCommand) (*usecase.AuthSession, error)
}

func (s *stubAuthController) GetMe(ctx context.Context, userID string) (*domain.User, error) {
	return nil, nil
}

func (s *stubAuthController) UpdateRole(ctx context.Context, userID string, cmd handlers.UpdateRoleCommand) error {
	return nil
}

func (s *stubAuthController) Signup(ctx context.Context, cmd handlers.SignupCommand) (*domain.User, error) {
	return nil, nil
}

func (s *stubAuthController) Login(ctx context.Context, cmd handlers.LoginCommand) (*usecase.AuthSession, error) {
	if s.loginFn != nil {
		return s.loginFn(ctx, cmd)
	}
	return nil, nil
}

func TestAuthHandler_Login_Success(t *testing.T) {
	controller := &stubAuthController{
		loginFn: func(ctx context.Context, cmd handlers.LoginCommand) (*usecase.AuthSession, error) {
			if cmd.Email != "user@example.com" || cmd.Password != "secret" {
				t.Fatalf("unexpected command: %+v", cmd)
			}
			return &usecase.AuthSession{
				AccessToken:  "access",
				RefreshToken: "refresh",
				TokenType:    "bearer",
				ExpiresIn:    3600,
				User: usecase.AuthUser{
					ID:    "user-1",
					Email: "user@example.com",
					Role:  "user",
				},
			}, nil
		},
	}

	handler := NewAuthHandler(controller)
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"email":"user@example.com","password":"secret"}`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := handler.Login(c); err != nil {
		t.Fatalf("handler returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Fatalf("unexpected status: got %d", rec.Code)
	}

	var resp presenter.AuthSessionResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.AccessToken != "access" || resp.User.Email != "user@example.com" {
		t.Fatalf("unexpected response body: %+v", resp)
	}
}

func TestAuthHandler_Login_InvalidJSON(t *testing.T) {
	handler := NewAuthHandler(&stubAuthController{})

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", strings.NewReader(`{"email":`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := handler.Login(c)
	if err == nil {
		t.Fatal("expected error but got nil")
	}

	var httpErr *presentation.HTTPError
	if !errors.As(err, &httpErr) {
		t.Fatalf("expected HTTPError, got %T", err)
	}
	if httpErr.Status != http.StatusBadRequest {
		t.Fatalf("expected 400 status, got %d", httpErr.Status)
	}
}
