package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/role"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

type mockOwnerAuthAdmin struct {
	UpdateUserCalled     bool
	UpdateUserCalledWith struct {
		UserID string
		Input  output.AuthUserUpdate
	}
	UpdateUserErr error
}

func (m *mockOwnerAuthAdmin) UpdateUser(ctx context.Context, userID string, in output.AuthUserUpdate) error {
	m.UpdateUserCalled = true
	m.UpdateUserCalledWith.UserID = userID
	m.UpdateUserCalledWith.Input = in
	return m.UpdateUserErr
}

func TestOwnerUseCase_Complete_Success(t *testing.T) {
	userUseCase := &testutil.MockUserUseCase{
		UpdateUserResult: entity.User{UserID: "user-1"},
		FindByIDResult:   entity.User{UserID: "user-1", Role: role.Owner},
	}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userUseCase, admin)

	phone := "090-1234-5678"
	payload := input.OwnerSignupCompleteInput{
		ContactName: "Test Owner",
		StoreName:   "Test Store",
		OpeningDate: "20250101",
		Phone:       &phone,
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	result, err := uc.Complete(context.Background(), user, payload)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != userUseCase.FindByIDResult.UserID {
		t.Errorf("expected UserID %s, got %s", userUseCase.FindByIDResult.UserID, result.UserID)
	}
	if result.Role != userUseCase.FindByIDResult.Role {
		t.Errorf("expected Role %s, got %s", userUseCase.FindByIDResult.Role, result.Role)
	}
	if !admin.UpdateUserCalled {
		t.Error("expected UpdateUser to be called")
	}
	if admin.UpdateUserCalledWith.UserID != user.UserID {
		t.Errorf("expected UpdateUser userID %s, got %s", user.UserID, admin.UpdateUserCalledWith.UserID)
	}
	roleValue, ok := admin.UpdateUserCalledWith.Input.AppMetadata["role"].(string)
	if !ok || roleValue != role.Owner {
		t.Errorf("expected AppMetadata role %s, got %v", role.Owner, admin.UpdateUserCalledWith.Input.AppMetadata["role"])
	}
	nameValue, ok := admin.UpdateUserCalledWith.Input.UserMetadata["name"].(string)
	if !ok || nameValue != payload.ContactName {
		t.Errorf("expected UserMetadata name %s, got %v", payload.ContactName, admin.UpdateUserCalledWith.Input.UserMetadata["name"])
	}
	if !userUseCase.UpdateUserRoleCalled {
		t.Error("expected UpdateUserRole to be called")
	}
	if userUseCase.UpdateUserRoleCalledWith.Role != role.Owner {
		t.Errorf("expected role %s, got %s", role.Owner, userUseCase.UpdateUserRoleCalledWith.Role)
	}
	if !userUseCase.UpdateUserCalled {
		t.Error("expected UpdateUser to be called")
	}
	if userUseCase.UpdateUserCalledWith.Input.Name == nil || *userUseCase.UpdateUserCalledWith.Input.Name != payload.ContactName {
		t.Errorf("expected Name %s, got %v", payload.ContactName, userUseCase.UpdateUserCalledWith.Input.Name)
	}
	if userUseCase.UpdateUserCalledWith.Input.Phone == nil || *userUseCase.UpdateUserCalledWith.Input.Phone != phone {
		t.Errorf("expected Phone %s, got %v", phone, userUseCase.UpdateUserCalledWith.Input.Phone)
	}
	if !userUseCase.FindByIDCalled {
		t.Error("expected FindByID to be called")
	}
}

func TestOwnerUseCase_Complete_InvalidInput(t *testing.T) {
	cases := []struct {
		name    string
		user    entity.User
		payload input.OwnerSignupCompleteInput
	}{
		{
			name: "missing contact name",
			user: entity.User{UserID: "user-1", Email: "owner@example.com"},
			payload: input.OwnerSignupCompleteInput{
				ContactName: "",
				StoreName:   "store",
				OpeningDate: "20250101",
			},
		},
		{
			name: "invalid date",
			user: entity.User{UserID: "user-1", Email: "owner@example.com"},
			payload: input.OwnerSignupCompleteInput{
				ContactName: "owner",
				StoreName:   "store",
				OpeningDate: "202501",
			},
		},
		{
			name: "missing email",
			user: entity.User{UserID: "user-1", Email: ""},
			payload: input.OwnerSignupCompleteInput{
				ContactName: "owner",
				StoreName:   "store",
				OpeningDate: "20250101",
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			userUseCase := &testutil.MockUserUseCase{}
			admin := &mockOwnerAuthAdmin{}
			uc := usecase.NewOwnerUseCase(userUseCase, admin)

			_, err := uc.Complete(context.Background(), tc.user, tc.payload)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
			if admin.UpdateUserCalled {
				t.Error("expected UpdateUser not to be called")
			}
			if userUseCase.UpdateUserRoleCalled || userUseCase.UpdateUserCalled || userUseCase.FindByIDCalled {
				t.Error("expected no user updates for invalid input")
			}
		})
	}
}

func TestOwnerUseCase_Complete_UpdateUserMetadataError(t *testing.T) {
	userUseCase := &testutil.MockUserUseCase{}
	adminErr := errors.New("supabase error")
	admin := &mockOwnerAuthAdmin{UpdateUserErr: adminErr}
	uc := usecase.NewOwnerUseCase(userUseCase, admin)

	payload := input.OwnerSignupCompleteInput{
		ContactName: "owner",
		StoreName:   "store",
		OpeningDate: "20250101",
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	_, err := uc.Complete(context.Background(), user, payload)
	if !errors.Is(err, adminErr) {
		t.Errorf("expected error %v, got %v", adminErr, err)
	}
	if userUseCase.UpdateUserRoleCalled {
		t.Error("expected UpdateUserRole not to be called")
	}
	if userUseCase.UpdateUserCalled || userUseCase.FindByIDCalled {
		t.Error("expected no user updates after admin error")
	}
}

func TestOwnerUseCase_Complete_UpdateRoleError(t *testing.T) {
	userUseCase := &testutil.MockUserUseCase{UpdateUserRoleErr: errors.New("role error")}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userUseCase, admin)

	payload := input.OwnerSignupCompleteInput{
		ContactName: "owner",
		StoreName:   "store",
		OpeningDate: "20250101",
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	_, err := uc.Complete(context.Background(), user, payload)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !admin.UpdateUserCalled {
		t.Error("expected UpdateUser to be called")
	}
	if userUseCase.UpdateUserCalled || userUseCase.FindByIDCalled {
		t.Error("expected no user updates after role error")
	}
}

func TestOwnerUseCase_Complete_UpdateUserError(t *testing.T) {
	userUseCase := &testutil.MockUserUseCase{UpdateUserErr: errors.New("update error")}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userUseCase, admin)

	payload := input.OwnerSignupCompleteInput{
		ContactName: "owner",
		StoreName:   "store",
		OpeningDate: "20250101",
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	_, err := uc.Complete(context.Background(), user, payload)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if !userUseCase.UpdateUserCalled {
		t.Error("expected UpdateUser to be called")
	}
	if userUseCase.FindByIDCalled {
		t.Error("expected FindByID not to be called")
	}
}

func TestOwnerUseCase_Complete_FindByIDError(t *testing.T) {
	findErr := errors.New("find error")
	userUseCase := &testutil.MockUserUseCase{
		UpdateUserResult: entity.User{UserID: "user-1"},
		FindByIDErr:      findErr,
	}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userUseCase, admin)

	payload := input.OwnerSignupCompleteInput{
		ContactName: "owner",
		StoreName:   "store",
		OpeningDate: "20250101",
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	_, err := uc.Complete(context.Background(), user, payload)
	if !errors.Is(err, findErr) {
		t.Errorf("expected error %v, got %v", findErr, err)
	}
	if !userUseCase.FindByIDCalled {
		t.Error("expected FindByID to be called")
	}
}
