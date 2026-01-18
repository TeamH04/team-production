package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
	"gorm.io/gorm"
)

type reportRepository struct {
	db *gorm.DB
}

// NewReportRepository は ReportRepository の実装を生成します
func NewReportRepository(db *gorm.DB) output.ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) FindAll(ctx context.Context) ([]entity.Report, error) {
	var reports []model.Report
	if err := r.db.WithContext(ctx).
		Order("created_at desc").
		Find(&reports).Error; err != nil {
		return nil, mapDBError(err)
	}
	return model.ToEntities[entity.Report, model.Report](reports), nil
}

func (r *reportRepository) FindByID(ctx context.Context, reportID int64) (*entity.Report, error) {
	var report model.Report
	if err := r.db.WithContext(ctx).First(&report, reportID).Error; err != nil {
		return nil, mapDBError(err)
	}

	entityReport := report.Entity()
	return &entityReport, nil
}

func (r *reportRepository) Create(ctx context.Context, report *entity.Report) error {
	record := model.Report{
		ReportID:   report.ReportID,
		UserID:     report.UserID,
		TargetType: report.TargetType,
		TargetID:   report.TargetID,
		Reason:     report.Reason,
		Status:     report.Status,
	}
	if err := r.db.WithContext(ctx).Create(&record).Error; err != nil {
		return mapDBError(err)
	}
	return nil
}

func (r *reportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	return mapDBError(r.db.WithContext(ctx).Model(&model.Report{}).
		Where("report_id = ?", reportID).
		Update("status", status).Error)
}
