package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"github.com/TeamH04/team-production/apps/backend/internal/ports"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/model"
	"gorm.io/gorm"
)

type reportRepository struct {
	db *gorm.DB
}

// NewReportRepository は ReportRepository の実装を生成します
func NewReportRepository(db *gorm.DB) ports.ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) FindAll(ctx context.Context) ([]domain.Report, error) {
	var reports []model.Report
	if err := r.db.WithContext(ctx).
		Order("created_at desc").
		Find(&reports).Error; err != nil {
		return nil, mapDBError(err)
	}
	result := make([]domain.Report, len(reports))
	for i, report := range reports {
		result[i] = model.ReportModelToDomain(report)
	}
	return result, nil
}

func (r *reportRepository) FindByID(ctx context.Context, reportID int64) (*domain.Report, error) {
	var report model.Report
	if err := r.db.WithContext(ctx).First(&report, reportID).Error; err != nil {
		return nil, mapDBError(err)
	}
	domainReport := model.ReportModelToDomain(report)
	return &domainReport, nil
}

func (r *reportRepository) Create(ctx context.Context, report *domain.Report) error {
	record := model.ReportModelFromDomain(report)
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return mapDBError(err)
	}
	report.ReportID = record.ReportID
	report.CreatedAt = record.CreatedAt
	report.UpdatedAt = record.UpdatedAt
	return nil
}

func (r *reportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	return mapDBError(r.db.WithContext(ctx).Model(&model.Report{}).
		Where("report_id = ?", reportID).
		Update("status", status).Error)
}
