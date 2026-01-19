package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

const testUserID = "user-1"

// --- Signup Tests ---

func TestAuthHandler_Signup_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/signup",
		`{"email":"test@example.com","password":"password123","name":"Test User"}`)

	mockAuthUC := &testutil.MockAuthUseCase{
		SignupResult: &entity.User{
			UserID: testUserID,
			Email:  "test@example.com",
			Name:   "Test User",
		},
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Signup(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != testUserID {
		t.Errorf("expected user_id %q, got %v", testUserID, response["user_id"])
	}
}

func TestAuthHandler_Signup_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/signup", `{invalid}`)

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Signup(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestAuthHandler_Signup_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/signup",
		`{"email":"test@example.com","password":"password123","name":"Test User"}`)

	mockAuthUC := &testutil.MockAuthUseCase{
		SignupErr: usecase.ErrInvalidInput,
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Signup(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- Login Tests ---

func TestAuthHandler_Login_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/login",
		`{"email":"test@example.com","password":"password123"}`)

	mockAuthUC := &testutil.MockAuthUseCase{
		LoginResult: &input.AuthSession{
			AccessToken:  "access-token",
			RefreshToken: "refresh-token",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
		},
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Login(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["access_token"] != "access-token" {
		t.Errorf("expected access_token 'access-token', got %v", response["access_token"])
	}
}

func TestAuthHandler_Login_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/login", `{invalid}`)

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Login(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/login",
		`{"email":"test@example.com","password":"wrongpassword"}`)

	mockAuthUC := &testutil.MockAuthUseCase{
		LoginErr: usecase.ErrUnauthorized,
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.Login(tc.Context)

	testutil.AssertError(t, err, "invalid credentials")
}

// --- GetMe Tests ---

func TestAuthHandler_GetMe_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/auth/me")

	user := entity.User{UserID: testUserID, Email: "test@example.com", Name: "Test User"}
	tc.SetUser(user, "user")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{
		FindByIDResult: user,
	}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.GetMe(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)

	// Verify response body
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != testUserID {
		t.Errorf("expected user_id %q, got %v", testUserID, response["user_id"])
	}
}

func TestAuthHandler_GetMe_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/auth/me")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.GetMe(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestAuthHandler_GetMe_UserNotFound(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/auth/me")

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{
		FindByIDErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.GetMe(tc.Context)

	testutil.AssertError(t, err, "user not found")
}

// --- UpdateRole Tests ---

func TestAuthHandler_UpdateRole_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/auth/role", `{"role":"owner"}`)

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.UpdateRole(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAuthHandler_UpdateRole_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/auth/role", `{"role":"owner"}`)

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.UpdateRole(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestAuthHandler_UpdateRole_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/auth/role", `{invalid}`)

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.UpdateRole(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestAuthHandler_UpdateRole_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPut, "/auth/role", `{"role":"owner"}`)

	user := entity.User{UserID: testUserID}
	tc.SetUser(user, "user")

	mockAuthUC := &testutil.MockAuthUseCase{}
	mockUserUC := &testutil.MockUserUseCase{
		UpdateUserRoleErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewAuthHandler(mockAuthUC, mockUserUC)

	err := h.UpdateRole(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
