package apperr_test

import (
	"errors"
	"testing"

	"github.com/TeamH04/team-production/apps/backend/internal/apperr"
)

func TestNew_WithError(t *testing.T) {
	originalErr := errors.New("original error")
	err := apperr.New(apperr.CodeNotFound, originalErr)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != "original error" {
		t.Errorf("expected error message 'original error', got '%s'", err.Error())
	}
}

func TestNew_WithNilError(t *testing.T) {
	err := apperr.New(apperr.CodeNotFound, nil)

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	if err.Error() != string(apperr.CodeNotFound) {
		t.Errorf("expected error message '%s', got '%s'", apperr.CodeNotFound, err.Error())
	}
}

func TestErrorf(t *testing.T) {
	err := apperr.Errorf(apperr.CodeInvalidInput, "invalid field: %s", "name")

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	expected := "invalid field: name"
	if err.Error() != expected {
		t.Errorf("expected error message '%s', got '%s'", expected, err.Error())
	}
}

func TestCodeOf_WithAppError(t *testing.T) {
	err := apperr.New(apperr.CodeNotFound, errors.New("not found"))

	code := apperr.CodeOf(err)

	if code != apperr.CodeNotFound {
		t.Errorf("expected code %s, got %s", apperr.CodeNotFound, code)
	}
}

func TestCodeOf_WithRegularError(t *testing.T) {
	err := errors.New("regular error")

	code := apperr.CodeOf(err)

	if code != apperr.CodeUnknown {
		t.Errorf("expected code %s, got %s", apperr.CodeUnknown, code)
	}
}

func TestCodeOf_WithNilError(t *testing.T) {
	code := apperr.CodeOf(nil)

	if code != apperr.CodeUnknown {
		t.Errorf("expected code %s, got %s", apperr.CodeUnknown, code)
	}
}

func TestCodeOf_WithWrappedAppError(t *testing.T) {
	originalErr := apperr.New(apperr.CodeNotFound, errors.New("not found"))
	wrappedErr := errors.New("wrapper: " + originalErr.Error())
	// Note: This won't preserve the code because we're just creating a new error
	// Let's test with proper wrapping
	properlyWrapped := apperr.New(apperr.CodeInternal, originalErr)

	code := apperr.CodeOf(properlyWrapped)

	if code != apperr.CodeInternal {
		t.Errorf("expected code %s, got %s", apperr.CodeInternal, code)
	}

	// The original wrapped error should not be detectable as CodeNotFound
	_ = wrappedErr
}

func TestIsCode_Match(t *testing.T) {
	err := apperr.New(apperr.CodeNotFound, errors.New("not found"))

	if !apperr.IsCode(err, apperr.CodeNotFound) {
		t.Error("expected IsCode to return true for matching code")
	}
}

func TestIsCode_NoMatch(t *testing.T) {
	err := apperr.New(apperr.CodeNotFound, errors.New("not found"))

	if apperr.IsCode(err, apperr.CodeInvalidInput) {
		t.Error("expected IsCode to return false for non-matching code")
	}
}

func TestIsCode_RegularError(t *testing.T) {
	err := errors.New("regular error")

	if apperr.IsCode(err, apperr.CodeNotFound) {
		t.Error("expected IsCode to return false for regular error")
	}
	if !apperr.IsCode(err, apperr.CodeUnknown) {
		t.Error("expected IsCode to return true for CodeUnknown on regular error")
	}
}

func TestUnwrap(t *testing.T) {
	originalErr := errors.New("original error")
	appErr := apperr.New(apperr.CodeNotFound, originalErr)

	if !errors.Is(appErr, originalErr) {
		t.Error("expected Unwrap to return original error")
	}
}

func TestAllCodes(t *testing.T) {
	codes := []apperr.Code{
		apperr.CodeUnknown,
		apperr.CodeInvalidInput,
		apperr.CodeNotFound,
		apperr.CodeConflict,
		apperr.CodeUnauthorized,
		apperr.CodeForbidden,
		apperr.CodeInternal,
	}

	for _, code := range codes {
		t.Run(string(code), func(t *testing.T) {
			err := apperr.New(code, nil)
			if !apperr.IsCode(err, code) {
				t.Errorf("expected IsCode to return true for %s", code)
			}
		})
	}
}
