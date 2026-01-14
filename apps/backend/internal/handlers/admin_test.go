package handlers_test

import (
	"net/http"
	"testing"

	"github.com/google/uuid"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
)

// --- GetPendingStores Tests ---

func TestAdminHandler_GetPendingStores_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/stores/pending")

	mockAdminUC := &testutil.MockAdminUseCase{
		GetPendingResult: []entity.Store{
			{StoreID: "store-1", Name: "Store 1"},
			{StoreID: "store-2", Name: "Store 2"},
		},
	}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetPendingStores(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_GetPendingStores_Empty(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/stores/pending")

	mockAdminUC := &testutil.MockAdminUseCase{
		GetPendingResult: []entity.Store{},
	}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetPendingStores(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_GetPendingStores_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/stores/pending")

	mockAdminUC := &testutil.MockAdminUseCase{
		GetPendingErr: usecase.ErrStoreNotFound,
	}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetPendingStores(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- ApproveStore Tests ---

func TestAdminHandler_ApproveStore_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/"+storeID+"/approve")
	tc.SetPath("/admin/stores/:id/approve", []string{"id"}, []string{storeID})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.ApproveStore(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_ApproveStore_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/invalid-uuid/approve")
	tc.SetPath("/admin/stores/:id/approve", []string{"id"}, []string{"invalid-uuid"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.ApproveStore(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestAdminHandler_ApproveStore_NotFound(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/"+storeID+"/approve")
	tc.SetPath("/admin/stores/:id/approve", []string{"id"}, []string{storeID})

	mockAdminUC := &testutil.MockAdminUseCase{
		ApproveErr: usecase.ErrStoreNotFound,
	}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.ApproveStore(tc.Context)

	testutil.AssertError(t, err, "store not found")
}

// --- RejectStore Tests ---

func TestAdminHandler_RejectStore_Success(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/"+storeID+"/reject")
	tc.SetPath("/admin/stores/:id/reject", []string{"id"}, []string{storeID})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.RejectStore(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_RejectStore_InvalidUUID(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/invalid-uuid/reject")
	tc.SetPath("/admin/stores/:id/reject", []string{"id"}, []string{"invalid-uuid"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.RejectStore(tc.Context)

	testutil.AssertError(t, err, "invalid UUID")
}

func TestAdminHandler_RejectStore_NotFound(t *testing.T) {
	storeID := uuid.New().String()
	tc := testutil.NewTestContextNoBody(http.MethodPost, "/admin/stores/"+storeID+"/reject")
	tc.SetPath("/admin/stores/:id/reject", []string{"id"}, []string{storeID})

	mockAdminUC := &testutil.MockAdminUseCase{
		RejectErr: usecase.ErrStoreNotFound,
	}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.RejectStore(tc.Context)

	testutil.AssertError(t, err, "store not found")
}

// --- GetReports Tests ---

func TestAdminHandler_GetReports_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/reports")

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{
		GetAllResult: []entity.Report{
			{ReportID: 1, TargetType: "review"},
			{ReportID: 2, TargetType: "store"},
		},
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetReports(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_GetReports_Empty(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/reports")

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{
		GetAllResult: []entity.Report{},
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetReports(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_GetReports_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/reports")

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{
		GetAllErr: usecase.ErrInvalidInput,
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetReports(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- HandleReport Tests ---

func TestAdminHandler_HandleReport_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/admin/reports/1/handle", `{"action":"resolve"}`)
	tc.SetPath("/admin/reports/:id/handle", []string{"id"}, []string{"1"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.HandleReport(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_HandleReport_InvalidID(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/admin/reports/invalid/handle", `{"action":"resolve"}`)
	tc.SetPath("/admin/reports/:id/handle", []string{"id"}, []string{"invalid"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.HandleReport(tc.Context)

	testutil.AssertError(t, err, "invalid ID")
}

func TestAdminHandler_HandleReport_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/admin/reports/1/handle", `{invalid}`)
	tc.SetPath("/admin/reports/:id/handle", []string{"id"}, []string{"1"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.HandleReport(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestAdminHandler_HandleReport_EmptyAction(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/admin/reports/1/handle", `{"action":""}`)
	tc.SetPath("/admin/reports/:id/handle", []string{"id"}, []string{"1"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.HandleReport(tc.Context)

	testutil.AssertError(t, err, "empty action")
}

func TestAdminHandler_HandleReport_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/admin/reports/1/handle", `{"action":"resolve"}`)
	tc.SetPath("/admin/reports/:id/handle", []string{"id"}, []string{"1"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{
		HandleReportErr: usecase.ErrInvalidInput,
	}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.HandleReport(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}

// --- GetUserByID Tests ---

func TestAdminHandler_GetUserByID_Success(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/users/user-1")
	tc.SetPath("/admin/users/:id", []string{"id"}, []string{"user-1"})

	user := entity.User{UserID: "user-1", Name: "Admin User"}
	tc.SetUser(user, "admin")

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{
		FindByIDResult: user,
	}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetUserByID(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestAdminHandler_GetUserByID_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/users/user-1")
	tc.SetPath("/admin/users/:id", []string{"id"}, []string{"user-1"})

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetUserByID(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestAdminHandler_GetUserByID_NotFound(t *testing.T) {
	tc := testutil.NewTestContextNoBody(http.MethodGet, "/admin/users/user-1")
	tc.SetPath("/admin/users/:id", []string{"id"}, []string{"user-1"})

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "admin")

	mockAdminUC := &testutil.MockAdminUseCase{}
	mockReportUC := &testutil.MockReportUseCase{}
	mockUserUC := &testutil.MockUserUseCase{
		FindByIDErr: usecase.ErrUserNotFound,
	}
	h := handlers.NewAdminHandler(mockAdminUC, mockReportUC, mockUserUC)

	err := h.GetUserByID(tc.Context)

	testutil.AssertError(t, err, "user not found")
}
