package repository_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/repository"
	"github.com/TeamH04/team-production/apps/backend/internal/repository/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/output"
)

// setupReportTest creates common test dependencies for report tests
func setupReportTest(t *testing.T) (*gorm.DB, output.ReportRepository, output.UserRepository) {
	t.Helper()
	db := testutil.SetupTestDB(t)

	reportRepo := repository.NewReportRepository(db)
	userRepo := repository.NewUserRepository(db)

	t.Cleanup(func() {
		testutil.CleanupTestDB(t, db)
	})

	return db, reportRepo, userRepo
}

// newTestReportUser creates a test user for report tests
func newTestReportUser(t *testing.T) *entity.User {
	t.Helper()
	return &entity.User{
		UserID:    "user-" + uuid.New().String()[:8],
		Email:     "test-" + uuid.New().String()[:8] + "@example.com",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// TestReportRepository_Create_Success tests creating a report using direct SQL
// This test uses direct SQL insert to verify database operations work correctly
func TestReportRepository_Create_Success(t *testing.T) {
	db, _, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Insert report directly into the database
	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 1, "inappropriate content", "pending", time.Now(), time.Now(),
	).Error)

	// Verify the record was inserted
	var count int64
	err := db.Table("reports").Where("user_id = ?", user.UserID).Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), count)
}

// TestReportRepository_Create_WithStoreTargetType tests creating a report for a store using direct SQL
func TestReportRepository_Create_WithStoreTargetType(t *testing.T) {
	db, _, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Insert report for store directly
	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "store", 123, "spam", "pending", time.Now(), time.Now(),
	).Error)

	// Verify the record was inserted
	var count int64
	err := db.Table("reports").Where("user_id = ? AND target_type = ?", user.UserID, "store").Count(&count).Error
	require.NoError(t, err)
	require.Equal(t, int64(1), count)
}

// TestReportRepository_FindByID_Success tests finding a report by ID
func TestReportRepository_FindByID_Success(t *testing.T) {
	db, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Insert report directly into the database
	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 1, "inappropriate content", "pending", time.Now(), time.Now(),
	).Error)

	// Get the created report ID from DB
	var createdReport struct {
		ReportID int64 `gorm:"column:report_id"`
	}
	err := db.Table("reports").Where("user_id = ?", user.UserID).First(&createdReport).Error
	require.NoError(t, err)

	// Find by ID
	found, err := reportRepo.FindByID(context.Background(), createdReport.ReportID)
	require.NoError(t, err)
	require.Equal(t, createdReport.ReportID, found.ReportID)
	require.Equal(t, user.UserID, found.UserID)
	require.Equal(t, "review", found.TargetType)
	require.Equal(t, "pending", found.Status)
}

// TestReportRepository_FindByID_NotFound tests finding a non-existent report
func TestReportRepository_FindByID_NotFound(t *testing.T) {
	_, reportRepo, _ := setupReportTest(t)

	nonexistentID := int64(99999)
	_, err := reportRepo.FindByID(context.Background(), nonexistentID)

	require.True(t, apperr.IsCode(err, apperr.CodeNotFound), "expected CodeNotFound error, got %v", err)
}

// TestReportRepository_FindAll_Success tests finding all reports
func TestReportRepository_FindAll_Success(t *testing.T) {
	db, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Insert multiple reports directly
	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 1, "spam", "pending", time.Now(), time.Now(),
	).Error)
	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 2, "harassment", "pending", time.Now(), time.Now(),
	).Error)

	// Find all
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, reports, 2)
}

// TestReportRepository_FindAll_Empty tests finding all reports when none exist
func TestReportRepository_FindAll_Empty(t *testing.T) {
	_, reportRepo, _ := setupReportTest(t)

	// Find all - should return empty
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Empty(t, reports)
}

// TestReportRepository_FindAll_OrderByCreatedAtDesc tests reports are ordered by created_at desc
func TestReportRepository_FindAll_OrderByCreatedAtDesc(t *testing.T) {
	db, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Insert reports with different timestamps
	time1 := time.Now().Add(-time.Hour)
	time2 := time.Now()

	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 1, "first report", "pending", time1, time1,
	).Error)

	require.NoError(t, db.Exec(
		"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		user.UserID, "review", 2, "second report", "pending", time2, time2,
	).Error)

	// Find all - should be ordered by created_at desc (newest first)
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, reports, 2)
	// Second report (created later) should come first
	require.Equal(t, "second report", reports[0].Reason)
	require.Equal(t, "first report", reports[1].Reason)
}

// TestReportRepository_UpdateStatus tests updating a report status
func TestReportRepository_UpdateStatus(t *testing.T) {
	tests := []struct {
		name      string
		newStatus string
	}{
		{"to resolved", "resolved"},
		{"to rejected", "rejected"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, reportRepo, userRepo := setupReportTest(t)

			// Create user
			user := newTestReportUser(t)
			require.NoError(t, userRepo.Create(context.Background(), user))

			// Insert report directly
			require.NoError(t, db.Exec(
				"INSERT INTO reports (user_id, target_type, target_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
				user.UserID, "review", 1, "inappropriate content", "pending", time.Now(), time.Now(),
			).Error)

			// Get the created report ID from DB
			var createdReport struct {
				ReportID int64 `gorm:"column:report_id"`
			}
			err := db.Table("reports").Where("user_id = ?", user.UserID).First(&createdReport).Error
			require.NoError(t, err)

			// Update status
			err = reportRepo.UpdateStatus(context.Background(), createdReport.ReportID, tt.newStatus)
			require.NoError(t, err)

			// Verify the update
			found, err := reportRepo.FindByID(context.Background(), createdReport.ReportID)
			require.NoError(t, err)
			require.Equal(t, tt.newStatus, found.Status)
		})
	}
}

// TestReportRepository_UpdateStatus_NonexistentReport tests updating status for non-existent report
func TestReportRepository_UpdateStatus_NonexistentReport(t *testing.T) {
	_, reportRepo, _ := setupReportTest(t)

	// Try to update non-existent report - GORM doesn't error on no rows affected
	nonexistentID := int64(99999)
	err := reportRepo.UpdateStatus(context.Background(), nonexistentID, "resolved")
	require.NoError(t, err) // GORM returns nil even if no rows updated
}

// TestReportRepository_Create_ViaRepository tests creating a report using the repository method
func TestReportRepository_Create_ViaRepository(t *testing.T) {
	_, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create report using repository
	report := &entity.Report{
		UserID:     user.UserID,
		TargetType: "review",
		TargetID:   1,
		Reason:     "inappropriate content",
		Status:     "pending",
	}

	err := reportRepo.Create(context.Background(), report)
	require.NoError(t, err)

	// Verify via FindAll
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, reports, 1)
	require.Equal(t, user.UserID, reports[0].UserID)
	require.Equal(t, "review", reports[0].TargetType)
	require.Equal(t, int64(1), reports[0].TargetID)
	require.Equal(t, "inappropriate content", reports[0].Reason)
	require.Equal(t, "pending", reports[0].Status)
}

// TestReportRepository_Create_WithDifferentTargetTypes tests creating reports with different target types
func TestReportRepository_Create_WithDifferentTargetTypes(t *testing.T) {
	tests := []struct {
		name       string
		targetType string
		targetID   int64
		reason     string
	}{
		{
			name:       "review target",
			targetType: "review",
			targetID:   100,
			reason:     "spam content",
		},
		{
			name:       "store target",
			targetType: "store",
			targetID:   200,
			reason:     "fake store",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, reportRepo, userRepo := setupReportTest(t)

			// Create user
			user := newTestReportUser(t)
			require.NoError(t, userRepo.Create(context.Background(), user))

			// Create report using repository
			report := &entity.Report{
				UserID:     user.UserID,
				TargetType: tt.targetType,
				TargetID:   tt.targetID,
				Reason:     tt.reason,
				Status:     "pending",
			}

			err := reportRepo.Create(context.Background(), report)
			require.NoError(t, err)

			// Verify via FindAll
			reports, err := reportRepo.FindAll(context.Background())
			require.NoError(t, err)
			require.Len(t, reports, 1)
			require.Equal(t, tt.targetType, reports[0].TargetType)
			require.Equal(t, tt.targetID, reports[0].TargetID)
			require.Equal(t, tt.reason, reports[0].Reason)
		})
	}
}

// TestReportRepository_Create_MultipleReportsBySameUser tests creating multiple reports by same user
func TestReportRepository_Create_MultipleReportsBySameUser(t *testing.T) {
	_, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create first report
	report1 := &entity.Report{
		UserID:     user.UserID,
		TargetType: "review",
		TargetID:   1,
		Reason:     "spam",
		Status:     "pending",
	}
	require.NoError(t, reportRepo.Create(context.Background(), report1))

	// Create second report
	report2 := &entity.Report{
		UserID:     user.UserID,
		TargetType: "store",
		TargetID:   2,
		Reason:     "misleading info",
		Status:     "pending",
	}
	require.NoError(t, reportRepo.Create(context.Background(), report2))

	// Verify both reports exist
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, reports, 2)
}

// TestReportRepository_Create_WithEmptyReason tests creating a report with empty reason
func TestReportRepository_Create_WithEmptyReason(t *testing.T) {
	_, reportRepo, userRepo := setupReportTest(t)

	// Create user
	user := newTestReportUser(t)
	require.NoError(t, userRepo.Create(context.Background(), user))

	// Create report with empty reason
	report := &entity.Report{
		UserID:     user.UserID,
		TargetType: "review",
		TargetID:   1,
		Reason:     "",
		Status:     "pending",
	}

	err := reportRepo.Create(context.Background(), report)
	require.NoError(t, err)

	// Verify report was created
	reports, err := reportRepo.FindAll(context.Background())
	require.NoError(t, err)
	require.Len(t, reports, 1)
	require.Equal(t, "", reports[0].Reason)
}

// TestReportRepository_Create_WithDifferentStatuses tests creating reports with different initial statuses
func TestReportRepository_Create_WithDifferentStatuses(t *testing.T) {
	tests := []struct {
		name   string
		status string
	}{
		{"pending status", "pending"},
		{"resolved status", "resolved"},
		{"rejected status", "rejected"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, reportRepo, userRepo := setupReportTest(t)

			// Create user
			user := newTestReportUser(t)
			require.NoError(t, userRepo.Create(context.Background(), user))

			// Create report with specific status
			report := &entity.Report{
				UserID:     user.UserID,
				TargetType: "review",
				TargetID:   1,
				Reason:     "test reason",
				Status:     tt.status,
			}

			err := reportRepo.Create(context.Background(), report)
			require.NoError(t, err)

			// Verify report was created with correct status
			reports, err := reportRepo.FindAll(context.Background())
			require.NoError(t, err)
			require.Len(t, reports, 1)
			require.Equal(t, tt.status, reports[0].Status)
		})
	}
}
