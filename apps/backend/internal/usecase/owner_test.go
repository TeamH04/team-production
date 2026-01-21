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
	userRepo := &testutil.MockUserRepository{
		FindByIDResult: entity.User{UserID: "user-1", Name: "Old Name", Email: "owner@example.com"},
	}
	transaction := &testutil.MockTransaction{}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userRepo, transaction, admin)

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
	if result.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", result.UserID)
	}
	if result.Role != role.Owner {
		t.Errorf("expected Role %s, got %s", role.Owner, result.Role)
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
	if !transaction.StartTransactionCalled {
		t.Error("expected transaction to be started")
	}
	if !userRepo.UpdateInTxCalled {
		t.Error("expected UpdateInTx to be called")
	}
	if userRepo.UpdateInTxCalledWith.User.Name != payload.ContactName {
		t.Errorf("expected Name %s, got %s", payload.ContactName, userRepo.UpdateInTxCalledWith.User.Name)
	}
	if userRepo.UpdateInTxCalledWith.User.Phone == nil || *userRepo.UpdateInTxCalledWith.User.Phone != phone {
		t.Errorf("expected Phone %s, got %v", phone, userRepo.UpdateInTxCalledWith.User.Phone)
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
			userRepo := &testutil.MockUserRepository{}
			transaction := &testutil.MockTransaction{}
			admin := &mockOwnerAuthAdmin{}
			uc := usecase.NewOwnerUseCase(userRepo, transaction, admin)

			_, err := uc.Complete(context.Background(), tc.user, tc.payload)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
			if admin.UpdateUserCalled {
				t.Error("expected UpdateUser not to be called")
			}
			if transaction.StartTransactionCalled {
				t.Error("expected no transaction for invalid input")
			}
		})
	}
}

func TestOwnerUseCase_Complete_UpdateUserMetadataError(t *testing.T) {
	userRepo := &testutil.MockUserRepository{}
	transaction := &testutil.MockTransaction{}
	adminErr := errors.New("supabase error")
	admin := &mockOwnerAuthAdmin{UpdateUserErr: adminErr}
	uc := usecase.NewOwnerUseCase(userRepo, transaction, admin)

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
	if transaction.StartTransactionCalled {
		t.Error("expected transaction not to be started")
	}
}

func TestOwnerUseCase_Complete_TransactionNil(t *testing.T) {
	userRepo := &testutil.MockUserRepository{}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userRepo, nil, admin)

	payload := input.OwnerSignupCompleteInput{
		ContactName: "owner",
		StoreName:   "store",
		OpeningDate: "20250101",
	}
	user := entity.User{UserID: "user-1", Email: "owner@example.com"}

	_, err := uc.Complete(context.Background(), user, payload)
	if !errors.Is(err, output.ErrInvalidTransaction) {
		t.Errorf("expected ErrInvalidTransaction, got %v", err)
	}
}

func TestOwnerUseCase_Complete_UpdateUserError(t *testing.T) {
	userRepo := &testutil.MockUserRepository{
		FindByIDResult: entity.User{UserID: "user-1", Email: "owner@example.com"},
		UpdateInTxErr:  errors.New("update error"),
	}
	transaction := &testutil.MockTransaction{}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userRepo, transaction, admin)

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
	if !userRepo.UpdateInTxCalled {
		t.Error("expected UpdateInTx to be called")
	}
}

func TestOwnerUseCase_Complete_FindByIDError(t *testing.T) {
	findErr := errors.New("find error")
	userRepo := &testutil.MockUserRepository{FindByIDErr: findErr}
	transaction := &testutil.MockTransaction{}
	admin := &mockOwnerAuthAdmin{}
	uc := usecase.NewOwnerUseCase(userRepo, transaction, admin)

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
	if transaction.StartTransactionCalled {
		t.Error("expected transaction not to be started")
	}
}
