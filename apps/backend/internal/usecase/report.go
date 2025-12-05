package usecase

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// ReportUseCase は通報に関するビジネスロジックを提供します
type ReportUseCase interface {
	CreateReport(ctx context.Context, input input.CreateReportInput) (*domain.Report, error)
	GetAllReports(ctx context.Context) ([]domain.Report, error)
	HandleReport(ctx context.Context, reportID int64, action input.HandleReportAction) error
}

type reportUseCase struct {
	reportRepo output.ReportRepository
	userRepo   output.UserRepository
}

// NewReportUseCase は ReportUseCase の実装を生成します
func NewReportUseCase(reportRepo output.ReportRepository, userRepo output.UserRepository) ReportUseCase {
	return &reportUseCase{
		reportRepo: reportRepo,
		userRepo:   userRepo,
	}
}

func (uc *reportUseCase) CreateReport(ctx context.Context, req input.CreateReportInput) (*domain.Report, error) {
	// ユーザーの存在確認
	if _, err := uc.userRepo.FindByID(ctx, req.UserID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// バリデーション
	if req.TargetType == "" || req.Reason == "" {
		return nil, ErrInvalidInput
	}

	validTargetTypes := map[string]bool{
		"review": true,
		"store":  true,
	}
	if !validTargetTypes[req.TargetType] {
		return nil, ErrInvalidTargetType
	}

	report := &domain.Report{
		UserID:     req.UserID,
		TargetType: req.TargetType,
		TargetID:   req.TargetID,
		Reason:     req.Reason,
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

func (uc *reportUseCase) HandleReport(ctx context.Context, reportID int64, action input.HandleReportAction) error {
	// 通報の存在確認
	if _, err := uc.reportRepo.FindByID(ctx, reportID); err != nil {
		if apperr.IsCode(err, apperr.CodeNotFound) {
			return ErrReportNotFound
		}
		return err
	}

	// アクションのバリデーション
	validActions := map[input.HandleReportAction]string{
		input.HandleReportResolve: "resolved",
		input.HandleReportReject:  "rejected",
	}

	status, ok := validActions[action]
	if !ok {
		return ErrInvalidAction
	}

	return uc.reportRepo.UpdateStatus(ctx, reportID, status)
}
