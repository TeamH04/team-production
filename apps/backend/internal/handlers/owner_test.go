package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

type mockOwnerUseCase struct {
	CompleteResult *entity.User
	CompleteErr    error
	CompleteCalled bool
	CompleteInput  struct {
		User  entity.User
		Input input.OwnerSignupCompleteInput
	}
}

func (m *mockOwnerUseCase) Complete(
	ctx context.Context,
	user entity.User,
	in input.OwnerSignupCompleteInput,
) (*entity.User, error) {
	m.CompleteCalled = true
	m.CompleteInput.User = user
	m.CompleteInput.Input = in
	if m.CompleteErr != nil {
		return nil, m.CompleteErr
	}
	return m.CompleteResult, nil
}

func TestOwnerHandler_Complete_Success(t *testing.T) {
	body := `{"contact_name":"Owner","store_name":"Test Store","opening_date":"20250101","phone":"090-1234-5678"}`
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/owner/signup/complete", body)
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}
	tc.SetUser(user, "user")

	mockUC := &mockOwnerUseCase{
		CompleteResult: &entity.User{UserID: "user-1", Name: "Owner"},
	}
	h := handlers.NewOwnerHandler(mockUC)

	err := h.Complete(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)

	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if response["user_id"] != "user-1" {
		t.Errorf("expected user_id 'user-1', got %v", response["user_id"])
	}

	if !mockUC.CompleteCalled {
		t.Fatal("expected Complete to be called")
	}
	if mockUC.CompleteInput.User.UserID != user.UserID {
		t.Errorf("expected userID %s, got %s", user.UserID, mockUC.CompleteInput.User.UserID)
	}
	if mockUC.CompleteInput.Input.ContactName != "Owner" {
		t.Errorf("expected ContactName 'Owner', got %s", mockUC.CompleteInput.Input.ContactName)
	}
	if mockUC.CompleteInput.Input.StoreName != "Test Store" {
		t.Errorf("expected StoreName 'Test Store', got %s", mockUC.CompleteInput.Input.StoreName)
	}
	if mockUC.CompleteInput.Input.OpeningDate != "20250101" {
		t.Errorf("expected OpeningDate '20250101', got %s", mockUC.CompleteInput.Input.OpeningDate)
	}
	if mockUC.CompleteInput.Input.Phone == nil || *mockUC.CompleteInput.Input.Phone != "090-1234-5678" {
		t.Errorf("expected Phone '090-1234-5678', got %v", mockUC.CompleteInput.Input.Phone)
	}
}

func TestOwnerHandler_Complete_Unauthorized(t *testing.T) {
	body := `{"contact_name":"Owner","store_name":"Test Store","opening_date":"20250101"}`
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/owner/signup/complete", body)

	mockUC := &mockOwnerUseCase{}
	h := handlers.NewOwnerHandler(mockUC)

	err := h.Complete(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
	if mockUC.CompleteCalled {
		t.Error("expected Complete not to be called")
	}
}

func TestOwnerHandler_Complete_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/owner/signup/complete", `{invalid}`)
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}
	tc.SetUser(user, "user")

	mockUC := &mockOwnerUseCase{}
	h := handlers.NewOwnerHandler(mockUC)

	err := h.Complete(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
	if mockUC.CompleteCalled {
		t.Error("expected Complete not to be called")
	}
}

func TestOwnerHandler_Complete_UseCaseError(t *testing.T) {
	body := `{"contact_name":"Owner","store_name":"Test Store","opening_date":"20250101"}`
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/auth/owner/signup/complete", body)
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}
	tc.SetUser(user, "user")

	mockUC := &mockOwnerUseCase{CompleteErr: usecase.ErrInvalidInput}
	h := handlers.NewOwnerHandler(mockUC)

	err := h.Complete(tc.Context)

	testutil.AssertError(t, err, "usecase error")
	if !mockUC.CompleteCalled {
		t.Error("expected Complete to be called")
	}
}
