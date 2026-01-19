package testutil

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/TeamH04/team-production/apps/backend/internal/domain/entity"
	"github.com/TeamH04/team-production/apps/backend/internal/presentation/requestcontext"
)

func TestStringPtr(t *testing.T) {
	s := "test"
	ptr := StringPtr(s)
	if ptr == nil {
		t.Fatal("StringPtr returned nil")
	}
	if *ptr != s {
		t.Errorf("StringPtr = %q, want %q", *ptr, s)
	}
}

func TestInt64Ptr(t *testing.T) {
	i := int64(42)
	ptr := Int64Ptr(i)
	if ptr == nil {
		t.Fatal("Int64Ptr returned nil")
	}
	if *ptr != i {
		t.Errorf("Int64Ptr = %d, want %d", *ptr, i)
	}
}

func TestIntPtr(t *testing.T) {
	i := 42
	ptr := IntPtr(i)
	if ptr == nil {
		t.Fatal("IntPtr returned nil")
	}
	if *ptr != i {
		t.Errorf("IntPtr = %d, want %d", *ptr, i)
	}
}

func TestFloat64Ptr(t *testing.T) {
	f := 3.14
	ptr := Float64Ptr(f)
	if ptr == nil {
		t.Fatal("Float64Ptr returned nil")
	}
	if *ptr != f {
		t.Errorf("Float64Ptr = %f, want %f", *ptr, f)
	}
}

func TestTimePtr(t *testing.T) {
	tm := time.Now()
	ptr := TimePtr(tm)
	if ptr == nil {
		t.Fatal("TimePtr returned nil")
	}
	if !ptr.Equal(tm) {
		t.Errorf("TimePtr = %v, want %v", *ptr, tm)
	}
}

func TestBoolPtr(t *testing.T) {
	b := true
	ptr := BoolPtr(b)
	if ptr == nil {
		t.Fatal("BoolPtr returned nil")
	}
	if *ptr != b {
		t.Errorf("BoolPtr = %v, want %v", *ptr, b)
	}
}

func TestMustMarshal(t *testing.T) {
	data := map[string]string{"key": "value"}
	result := MustMarshal(t, data)
	expected := `{"key":"value"}`
	if string(result) != expected {
		t.Errorf("MustMarshal = %s, want %s", result, expected)
	}
}

func TestNewTestContext(t *testing.T) {
	tc := NewTestContext(http.MethodGet, "/test", nil)
	if tc == nil {
		t.Fatal("NewTestContext returned nil")
	}
	if tc.Context == nil {
		t.Error("Context is nil")
	}
	if tc.Recorder == nil {
		t.Error("Recorder is nil")
	}
	if tc.Echo == nil {
		t.Error("Echo is nil")
	}
	if tc.Context.Request().Method != http.MethodGet {
		t.Errorf("Method = %s, want %s", tc.Context.Request().Method, http.MethodGet)
	}
}

func TestNewTestContextWithJSON(t *testing.T) {
	jsonBody := `{"name":"test"}`
	tc := NewTestContextWithJSON(http.MethodPost, "/test", jsonBody)
	if tc == nil {
		t.Fatal("NewTestContextWithJSON returned nil")
	}
	if tc.Context.Request().Header.Get("Content-Type") != "application/json" {
		t.Error("Content-Type header not set")
	}
}

func TestNewTestContextNoBody(t *testing.T) {
	tc := NewTestContextNoBody(http.MethodGet, "/test")
	if tc == nil {
		t.Fatal("NewTestContextNoBody returned nil")
	}
	// Body can be nil or http.NoBody for no-body requests - both are valid
}

func TestTestContext_SetPath(t *testing.T) {
	tc := NewTestContextNoBody(http.MethodGet, "/stores/:id")
	tc.SetPath("/stores/:id", []string{"id"}, []string{"store-123"})

	if tc.Context.Param("id") != "store-123" {
		t.Errorf("Param(id) = %q, want %q", tc.Context.Param("id"), "store-123")
	}
}

func TestTestContext_SetUser(t *testing.T) {
	tc := NewTestContextNoBody(http.MethodGet, "/test")
	user := entity.User{
		UserID: "user-123",
		Name:   "Test User",
	}
	tc.SetUser(user, "user")

	// Verify user is stored in request context
	ctx := tc.Context.Request().Context()
	storedUser, err := requestcontext.GetUserFromContext(ctx)
	if err != nil {
		t.Fatalf("failed to get user from context: %v", err)
	}
	if storedUser.UserID != user.UserID {
		t.Errorf("stored user ID = %q, want %q", storedUser.UserID, user.UserID)
	}
	if storedUser.Name != user.Name {
		t.Errorf("stored user Name = %q, want %q", storedUser.Name, user.Name)
	}

	// Verify role is also stored
	role, err := requestcontext.GetUserRoleFromContext(ctx)
	if err != nil {
		t.Fatalf("failed to get role from context: %v", err)
	}
	if role != "user" {
		t.Errorf("stored role = %q, want %q", role, "user")
	}
}

func TestTestContext_SetAuthHeader(t *testing.T) {
	tc := NewTestContextNoBody(http.MethodGet, "/test")
	tc.SetAuthHeader("my-token")

	authHeader := tc.Context.Request().Header.Get("Authorization")
	expected := "Bearer my-token"
	if authHeader != expected {
		t.Errorf("Authorization header = %q, want %q", authHeader, expected)
	}
}

func TestAssertSuccess(t *testing.T) {
	t.Run("passes when no error and status matches", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rec.Code = http.StatusOK
		// Verifies that AssertSuccess does not fail when conditions are met
		AssertSuccess(t, nil, rec, http.StatusOK)
	})

	t.Run("passes with different status codes", func(t *testing.T) {
		testCases := []int{
			http.StatusCreated,
			http.StatusAccepted,
			http.StatusNoContent,
		}
		for _, status := range testCases {
			rec := httptest.NewRecorder()
			rec.Code = status
			AssertSuccess(t, nil, rec, status)
		}
	})
}

func TestAssertNoError(t *testing.T) {
	t.Run("passes when error is nil", func(t *testing.T) {
		// Verifies that AssertNoError does not fail when error is nil
		AssertNoError(t, nil)
	})
}

func TestAssertError(t *testing.T) {
	t.Run("passes when error is not nil", func(t *testing.T) {
		// Verifies that AssertError does not fail when error exists
		AssertError(t, errors.New("test error"), "test case")
	})

	t.Run("passes with various error types", func(t *testing.T) {
		testCases := []error{
			errors.New("simple error"),
			fmt.Errorf("formatted error: %d", 42),
			fmt.Errorf("wrapped: %w", errors.New("inner")),
		}
		for i, err := range testCases {
			AssertError(t, err, fmt.Sprintf("test case %d", i))
		}
	})
}

func TestAssertErrorIs(t *testing.T) {
	t.Run("passes when error matches", func(t *testing.T) {
		targetErr := errors.New("target error")
		wrappedErr := fmt.Errorf("wrapped: %w", targetErr)
		// Verifies that AssertErrorIs does not fail when errors match
		AssertErrorIs(t, wrappedErr, targetErr, "wrapped error")
	})

	t.Run("passes with direct error match", func(t *testing.T) {
		err := errors.New("target error")
		AssertErrorIs(t, err, err, "same error instance")
	})

	t.Run("passes with multi-level wrapping", func(t *testing.T) {
		targetErr := errors.New("target error")
		wrappedOnce := fmt.Errorf("level 1: %w", targetErr)
		wrappedTwice := fmt.Errorf("level 2: %w", wrappedOnce)
		AssertErrorIs(t, wrappedTwice, targetErr, "multi-level wrapped error")
	})
}

func TestAssertErrorContains(t *testing.T) {
	t.Run("passes when error contains substring", func(t *testing.T) {
		err := errors.New("this is a test error message")
		// Verifies that AssertErrorContains does not fail when substring is found
		AssertErrorContains(t, err, "test error", "substring check")
	})

	t.Run("passes with various substrings", func(t *testing.T) {
		err := errors.New("connection failed: timeout after 30s")
		testCases := []string{
			"connection",
			"failed",
			"timeout",
			"30s",
			"connection failed",
		}
		for _, substring := range testCases {
			AssertErrorContains(t, err, substring, "substring: "+substring)
		}
	})
}

func TestAssertStatus(t *testing.T) {
	t.Run("passes when status matches", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rec.Code = http.StatusCreated
		// Verifies that AssertStatus does not fail when status matches
		AssertStatus(t, rec, http.StatusCreated)
	})

	t.Run("passes with various status codes", func(t *testing.T) {
		testCases := []int{
			http.StatusOK,
			http.StatusCreated,
			http.StatusAccepted,
			http.StatusNoContent,
			http.StatusBadRequest,
			http.StatusNotFound,
			http.StatusInternalServerError,
		}
		for _, status := range testCases {
			rec := httptest.NewRecorder()
			rec.Code = status
			AssertStatus(t, rec, status)
		}
	})

	t.Run("detects status mismatch", func(t *testing.T) {
		mockT := &testing.T{}
		rec := httptest.NewRecorder()
		rec.Code = http.StatusBadRequest
		AssertStatus(mockT, rec, http.StatusOK)
		if !mockT.Failed() {
			t.Error("AssertStatus should mark test as failed when status does not match")
		}
	})
}

func TestAssertStatusOK(t *testing.T) {
	t.Run("passes when status is OK", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rec.Code = http.StatusOK
		// Verifies that AssertStatusOK does not fail for StatusOK
		AssertStatusOK(t, rec)
	})

	t.Run("detects non-OK status", func(t *testing.T) {
		mockT := &testing.T{}
		rec := httptest.NewRecorder()
		rec.Code = http.StatusBadRequest
		AssertStatusOK(mockT, rec)
		if !mockT.Failed() {
			t.Error("AssertStatusOK should mark test as failed when status is not OK")
		}
	})
}

func TestAssertStatusCreated(t *testing.T) {
	t.Run("passes when status is Created", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rec.Code = http.StatusCreated
		// Verifies that AssertStatusCreated does not fail for StatusCreated
		AssertStatusCreated(t, rec)
	})

	t.Run("detects non-Created status", func(t *testing.T) {
		mockT := &testing.T{}
		rec := httptest.NewRecorder()
		rec.Code = http.StatusOK
		AssertStatusCreated(mockT, rec)
		if !mockT.Failed() {
			t.Error("AssertStatusCreated should mark test as failed when status is not Created")
		}
	})
}

func TestAssertStatusNoContent(t *testing.T) {
	t.Run("passes when status is NoContent", func(t *testing.T) {
		rec := httptest.NewRecorder()
		rec.Code = http.StatusNoContent
		// Verifies that AssertStatusNoContent does not fail for StatusNoContent
		AssertStatusNoContent(t, rec)
	})

	t.Run("detects non-NoContent status", func(t *testing.T) {
		mockT := &testing.T{}
		rec := httptest.NewRecorder()
		rec.Code = http.StatusOK
		AssertStatusNoContent(mockT, rec)
		if !mockT.Failed() {
			t.Error("AssertStatusNoContent should mark test as failed when status is not NoContent")
		}
	})
}
