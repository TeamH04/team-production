package entity

import (
	"testing"
)

func TestErrNotFound(t *testing.T) {
	if ErrNotFound == nil {
		t.Error("ErrNotFound should not be nil")
	}
	if ErrNotFound.Error() != "not found" {
		t.Errorf("ErrNotFound.Error() = %q, want %q", ErrNotFound.Error(), "not found")
	}
}
