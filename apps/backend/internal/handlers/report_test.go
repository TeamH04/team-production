package handlers_test

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- CreateReport Tests ---

func TestReportHandler_CreateReport_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/reports",
		`{"target_type":"review","target_id":123,"reason":"spam"}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReportUseCase{
		CreateResult: &entity.Report{
			ReportID:   1,
			UserID:     "user-1",
			TargetType: "review",
			TargetID:   123,
			Reason:     "spam",
		},
	}
	h := handlers.NewReportHandler(mockUC)

	err := h.CreateReport(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusCreated)

	// Verify response body contains the created report
	var response map[string]interface{}
	if err := json.Unmarshal(tc.Recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	// Check report_id exists in response
	if _, ok := response["report_id"]; !ok {
		t.Error("expected report_id in response")
	}
}

func TestReportHandler_CreateReport_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/reports",
		`{"target_type":"review","target_id":123,"reason":"spam"}`)

	mockUC := &testutil.MockReportUseCase{}
	h := handlers.NewReportHandler(mockUC)

	err := h.CreateReport(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestReportHandler_CreateReport_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/reports", `{invalid}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReportUseCase{}
	h := handlers.NewReportHandler(mockUC)

	err := h.CreateReport(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestReportHandler_CreateReport_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/reports",
		`{"target_type":"review","target_id":123,"reason":"spam"}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockReportUseCase{
		CreateErr: usecase.ErrInvalidInput,
	}
	h := handlers.NewReportHandler(mockUC)

	err := h.CreateReport(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
