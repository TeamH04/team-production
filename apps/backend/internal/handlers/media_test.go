package handlers_test

import (
	"net/http"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers"
	"github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase"
	"github.com/TeamH04/team-production/apps/backend/internal/usecase/input"
)

// --- CreateReviewUploads Tests ---

func TestMediaHandler_CreateReviewUploads_Success(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads",
		`{"store_id":"store-1","files":[{"file_name":"image.jpg","content_type":"image/jpeg"}]}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockMediaUseCase{
		CreateResult: []input.SignedUploadFile{
			{
				FileID:      "file-1",
				ObjectKey:   "uploads/file-1.jpg",
				UploadURL:   "https://example.com/upload",
				ContentType: "image/jpeg",
			},
		},
	}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertSuccess(t, err, tc.Recorder, http.StatusOK)
}

func TestMediaHandler_CreateReviewUploads_Unauthorized(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads",
		`{"store_id":"store-1","files":[{"file_name":"image.jpg","content_type":"image/jpeg"}]}`)

	mockUC := &testutil.MockMediaUseCase{}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertError(t, err, "unauthorized")
}

func TestMediaHandler_CreateReviewUploads_InvalidJSON(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads", `{invalid}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockMediaUseCase{}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertError(t, err, "invalid JSON")
}

func TestMediaHandler_CreateReviewUploads_MissingStoreID(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads",
		`{"store_id":"","files":[{"file_name":"image.jpg","content_type":"image/jpeg"}]}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockMediaUseCase{}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertError(t, err, "missing store_id")
}

func TestMediaHandler_CreateReviewUploads_EmptyFiles(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads",
		`{"store_id":"store-1","files":[]}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockMediaUseCase{}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertError(t, err, "empty files")
}

func TestMediaHandler_CreateReviewUploads_UseCaseError(t *testing.T) {
	tc := testutil.NewTestContextWithJSON(http.MethodPost, "/uploads",
		`{"store_id":"store-1","files":[{"file_name":"image.jpg","content_type":"image/jpeg"}]}`)

	user := entity.User{UserID: "user-1"}
	tc.SetUser(user, "user")

	mockUC := &testutil.MockMediaUseCase{
		CreateErr: usecase.ErrStoreNotFound,
	}
	h := handlers.NewMediaHandler(mockUC)

	err := h.CreateReviewUploads(tc.Context)

	testutil.AssertError(t, err, "usecase error")
}
