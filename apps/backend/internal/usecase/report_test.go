package usecase_test

import (
	"context"
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// mockReportRepository implements output.ReportRepository for testing
type mockReportRepository struct {
	findAllResult     []entity.Report
	findAllErr        error
	findByIDResult    *entity.Report
	findByIDErr       error
	createErr         error
	updateStatusErr   error
}

func (m *mockReportRepository) FindAll(ctx context.Context) ([]entity.Report, error) {
	if m.findAllErr != nil {
		return nil, m.findAllErr
	}
	return m.findAllResult, nil
}

func (m *mockReportRepository) FindByID(ctx context.Context, reportID int64) (*entity.Report, error) {
	if m.findByIDErr != nil {
		return nil, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockReportRepository) Create(ctx context.Context, report *entity.Report) error {
	return m.createErr
}

func (m *mockReportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	return m.updateStatusErr
}

// mockUserRepoForReport implements output.UserRepository for report tests
type mockUserRepoForReport struct {
	findByIDResult entity.User
	findByIDErr    error
}

func (m *mockUserRepoForReport) FindByID(ctx context.Context, userID string) (entity.User, error) {
	if m.findByIDErr != nil {
		return entity.User{}, m.findByIDErr
	}
	return m.findByIDResult, nil
}

func (m *mockUserRepoForReport) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepoForReport) Create(ctx context.Context, user *entity.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepoForReport) Update(ctx context.Context, user entity.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepoForReport) UpdateRole(ctx context.Context, userID string, role string) error {
	return errors.New("not implemented")
}

// --- CreateReport Tests ---

func TestCreateReport_Success(t *testing.T) {
	reportRepo := &mockReportRepository{}
	userRepo := &mockUserRepoForReport{findByIDResult: entity.User{UserID: "user-1"}}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	result, err := uc.CreateReport(context.Background(), input.CreateReportInput{
		UserID:     "user-1",
		TargetType: "review",
		TargetID:   123,
		Reason:     "Inappropriate content",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", result.UserID)
	}
	if result.TargetType != "review" {
		t.Errorf("expected TargetType review, got %s", result.TargetType)
	}
	if result.Status != "pending" {
		t.Errorf("expected Status pending, got %s", result.Status)
	}
}

func TestCreateReport_UserNotFound(t *testing.T) {
	reportRepo := &mockReportRepository{}
	userRepo := &mockUserRepoForReport{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	_, err := uc.CreateReport(context.Background(), input.CreateReportInput{
		UserID:     "nonexistent",
		TargetType: "review",
		TargetID:   123,
		Reason:     "Inappropriate content",
	})
	if !errors.Is(err, usecase.ErrUserNotFound) {
		t.Errorf("expected ErrUserNotFound, got %v", err)
	}
}

func TestCreateReport_InvalidInput(t *testing.T) {
	tests := []struct {
		name  string
		input input.CreateReportInput
	}{
		{
			name: "empty target type",
			input: input.CreateReportInput{
				UserID:     "user-1",
				TargetType: "",
				TargetID:   123,
				Reason:     "Inappropriate content",
			},
		},
		{
			name: "empty reason",
			input: input.CreateReportInput{
				UserID:     "user-1",
				TargetType: "review",
				TargetID:   123,
				Reason:     "",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reportRepo := &mockReportRepository{}
			userRepo := &mockUserRepoForReport{findByIDResult: entity.User{UserID: "user-1"}}

			uc := usecase.NewReportUseCase(reportRepo, userRepo)

			_, err := uc.CreateReport(context.Background(), tt.input)
			if !errors.Is(err, usecase.ErrInvalidInput) {
				t.Errorf("expected ErrInvalidInput, got %v", err)
			}
		})
	}
}

func TestCreateReport_InvalidTargetType(t *testing.T) {
	reportRepo := &mockReportRepository{}
	userRepo := &mockUserRepoForReport{findByIDResult: entity.User{UserID: "user-1"}}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	_, err := uc.CreateReport(context.Background(), input.CreateReportInput{
		UserID:     "user-1",
		TargetType: "invalid",
		TargetID:   123,
		Reason:     "Inappropriate content",
	})
	if !errors.Is(err, usecase.ErrInvalidTargetType) {
		t.Errorf("expected ErrInvalidTargetType, got %v", err)
	}
}

func TestCreateReport_ValidTargetTypes(t *testing.T) {
	validTypes := []string{"review", "store"}

	for _, targetType := range validTypes {
		t.Run(targetType, func(t *testing.T) {
			reportRepo := &mockReportRepository{}
			userRepo := &mockUserRepoForReport{findByIDResult: entity.User{UserID: "user-1"}}

			uc := usecase.NewReportUseCase(reportRepo, userRepo)

			result, err := uc.CreateReport(context.Background(), input.CreateReportInput{
				UserID:     "user-1",
				TargetType: targetType,
				TargetID:   123,
				Reason:     "Inappropriate content",
			})
			if err != nil {
				t.Errorf("expected no error for target type %s, got %v", targetType, err)
			}
			if result.TargetType != targetType {
				t.Errorf("expected TargetType %s, got %s", targetType, result.TargetType)
			}
		})
	}
}

func TestCreateReport_CreateError(t *testing.T) {
	createErr := errors.New("create error")
	reportRepo := &mockReportRepository{createErr: createErr}
	userRepo := &mockUserRepoForReport{findByIDResult: entity.User{UserID: "user-1"}}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	_, err := uc.CreateReport(context.Background(), input.CreateReportInput{
		UserID:     "user-1",
		TargetType: "review",
		TargetID:   123,
		Reason:     "Inappropriate content",
	})
	if !errors.Is(err, createErr) {
		t.Errorf("expected create error, got %v", err)
	}
}

// --- GetAllReports Tests ---

func TestGetAllReports_Success(t *testing.T) {
	reports := []entity.Report{
		{ReportID: 1, UserID: "user-1", TargetType: "review", Status: "pending"},
		{ReportID: 2, UserID: "user-2", TargetType: "store", Status: "resolved"},
	}
	reportRepo := &mockReportRepository{findAllResult: reports}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	result, err := uc.GetAllReports(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 reports, got %d", len(result))
	}
}

func TestGetAllReports_EmptyReports(t *testing.T) {
	reportRepo := &mockReportRepository{findAllResult: []entity.Report{}}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	result, err := uc.GetAllReports(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected 0 reports, got %d", len(result))
	}
}

func TestGetAllReports_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	reportRepo := &mockReportRepository{findAllErr: dbErr}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	_, err := uc.GetAllReports(context.Background())
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}

// --- HandleReport Tests ---

func TestHandleReport_Resolve(t *testing.T) {
	reportRepo := &mockReportRepository{
		findByIDResult: &entity.Report{ReportID: 1, Status: "pending"},
	}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 1, input.HandleReportResolve)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHandleReport_Reject(t *testing.T) {
	reportRepo := &mockReportRepository{
		findByIDResult: &entity.Report{ReportID: 1, Status: "pending"},
	}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 1, input.HandleReportReject)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestHandleReport_ReportNotFound(t *testing.T) {
	reportRepo := &mockReportRepository{
		findByIDErr: apperr.New(apperr.CodeNotFound, entity.ErrNotFound),
	}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 999, input.HandleReportResolve)
	if !errors.Is(err, usecase.ErrReportNotFound) {
		t.Errorf("expected ErrReportNotFound, got %v", err)
	}
}

func TestHandleReport_InvalidAction(t *testing.T) {
	reportRepo := &mockReportRepository{
		findByIDResult: &entity.Report{ReportID: 1, Status: "pending"},
	}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 1, "invalid_action")
	if !errors.Is(err, usecase.ErrInvalidAction) {
		t.Errorf("expected ErrInvalidAction, got %v", err)
	}
}

func TestHandleReport_UpdateStatusError(t *testing.T) {
	updateErr := errors.New("update error")
	reportRepo := &mockReportRepository{
		findByIDResult:  &entity.Report{ReportID: 1, Status: "pending"},
		updateStatusErr: updateErr,
	}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 1, input.HandleReportResolve)
	if !errors.Is(err, updateErr) {
		t.Errorf("expected update error, got %v", err)
	}
}

func TestHandleReport_RepositoryError(t *testing.T) {
	dbErr := errors.New("database error")
	reportRepo := &mockReportRepository{findByIDErr: dbErr}
	userRepo := &mockUserRepoForReport{}

	uc := usecase.NewReportUseCase(reportRepo, userRepo)

	err := uc.HandleReport(context.Background(), 1, input.HandleReportResolve)
	if !errors.Is(err, dbErr) {
		t.Errorf("expected database error, got %v", err)
	}
}
