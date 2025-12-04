package interactor

import (
	"context"
	"errors"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"gorm.io/gorm"
)

// ReportUseCase は通報に関するビジネスロジックを提供します
type ReportUseCase interface {
	CreateReport(ctx context.Context, input CreateReportInput) (*domain.Report, error)
	GetAllReports(ctx context.Context) ([]domain.Report, error)
	HandleReport(ctx context.Context, reportID int64, action string) error
}

type CreateReportInput struct {
	UserID     string
	TargetType string
	TargetID   int64
	Reason     string
}

type reportUseCase struct {
	reportRepo repository.ReportRepository
	userRepo   repository.UserRepository
}

// NewReportUseCase は ReportUseCase の実装を生成します
func NewReportUseCase(reportRepo repository.ReportRepository, userRepo repository.UserRepository) ReportUseCase {
	return &reportUseCase{
		reportRepo: reportRepo,
		userRepo:   userRepo,
	}
}

func (uc *reportUseCase) CreateReport(ctx context.Context, input CreateReportInput) (*domain.Report, error) {
	// ユーザーの存在確認
	_, err := uc.userRepo.FindByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// バリデーション
	if input.TargetType == "" || input.Reason == "" {
		return nil, ErrInvalidInput
	}

	validTargetTypes := map[string]bool{
		"review": true,
		"store":  true,
	}
	if !validTargetTypes[input.TargetType] {
		return nil, ErrInvalidTargetType
	}

	report := &domain.Report{
		UserID:     input.UserID,
		TargetType: input.TargetType,
		TargetID:   input.TargetID,
		Reason:     input.Reason,
		Status:     "pending",
	}

	if err := uc.reportRepo.Create(ctx, report); err != nil {
		return nil, err
	}

	return report, nil
}

func (uc *reportUseCase) GetAllReports(ctx context.Context) ([]domain.Report, error) {
	return uc.reportRepo.FindAll(ctx)
}

func (uc *reportUseCase) HandleReport(ctx context.Context, reportID int64, action string) error {
	// 通報の存在確認
	_, err := uc.reportRepo.FindByID(ctx, reportID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrReportNotFound
		}
		return err
	}

	// アクションのバリデーション
	validActions := map[string]string{
		"resolve": "resolved",
		"reject":  "rejected",
	}

	status, ok := validActions[action]
	if !ok {
		return ErrInvalidAction
	}

	return uc.reportRepo.UpdateStatus(ctx, reportID, status)
}
