package repository

import (
	"context"

	"github.com/TeamH04/team-production/apps/backend/internal/domain"
	"gorm.io/gorm"
)

// ReportRepository は通報のデータアクセスを抽象化するインターフェース
type ReportRepository interface {
	FindAll(ctx context.Context) ([]domain.Report, error)
	FindByID(ctx context.Context, reportID int64) (*domain.Report, error)
	Create(ctx context.Context, report *domain.Report) error
	UpdateStatus(ctx context.Context, reportID int64, status string) error
}

type reportRepository struct {
	db *gorm.DB
}

// NewReportRepository は ReportRepository の実装を生成します
func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) FindAll(ctx context.Context) ([]domain.Report, error) {
	var reports []domain.Report
	if err := r.db.WithContext(ctx).
		Order("created_at desc").
		Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

func (r *reportRepository) FindByID(ctx context.Context, reportID int64) (*domain.Report, error) {
	var report domain.Report
	if err := r.db.WithContext(ctx).First(&report, reportID).Error; err != nil {
		return nil, err
	}
	return &report, nil
}

func (r *reportRepository) Create(ctx context.Context, report *domain.Report) error {
	return r.db.WithContext(ctx).Create(report).Error
}

func (r *reportRepository) UpdateStatus(ctx context.Context, reportID int64, status string) error {
	return r.db.WithContext(ctx).Model(&domain.Report{}).
		Where("report_id = ?", reportID).
		Update("status", status).Error
}
